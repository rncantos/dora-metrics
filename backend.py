from fastapi import FastAPI, HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import os
import warnings
import datetime
import json
import glob

warnings.filterwarnings("ignore", category=FutureWarning)
os.environ["PYTHONWARNINGS"] = "ignore"

from dotenv import load_dotenv
from dora_metrics.agent import create_dora_agent

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    repo_name: str = Field(..., pattern=r"^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$")

@app.get("/api/history")
def get_history():
    os.makedirs("reports", exist_ok=True)
    files = glob.glob("reports/*.json")
    history = []
    for f in sorted(files, reverse=True):
        try:
            with open(f, "r") as file:
                data = json.load(file)
                history.append(data)
        except Exception as e:
            print(f"Error reading {f}: {e}")
    return history

@app.post("/api/analyze/stream")
@limiter.limit("5/minute")
async def analyze_repo_stream(req: AnalyzeRequest, request: Request):
    if not os.getenv("GOOGLE_API_KEY") or not os.getenv("GITHUB_TOKEN"):
        raise HTTPException(status_code=500, detail="Missing credentials in .env")

    async def generate():
        agent = create_dora_agent()
        full_output = ""
        
        try:
            # astream_events version="v2" yields events live
            async for event in agent.astream_events({"repo_name": req.repo_name}, version="v2"):
                kind = event["event"]
                
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"].content
                    if chunk and isinstance(chunk, str):
                        full_output += chunk
                        yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\\n\\n"
                
                elif kind == "on_tool_start":
                    inputs = event.get("data", {}).get("input", {})
                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': event['name'], 'inputs': inputs})}\\n\\n"
                    
                elif kind == "on_tool_end":
                    yield f"data: {json.dumps({'type': 'tool_end', 'tool': event['name']})}\\n\\n"
                    
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\\n\\n"
            return
            
        # When finished, process the final JSON
        executive_data = None
        report_md = full_output
        if "---JSON_START---" in full_output:
            parts = full_output.split("---JSON_START---")
            report_md = parts[0].strip()
            try:
                json_str = parts[1].strip().replace("```json", "").replace("```", "")
                executive_data = json.loads(json_str)
            except Exception as e:
                print(f"Error parsing JSON: {e}")
                
        # Save results
        os.makedirs("reports", exist_ok=True)
        safe_repo_name = req.repo_name.replace("/", "_")
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        result_payload = {
            "id": timestamp,
            "repo_name": req.repo_name,
            "timestamp": timestamp,
            "report": report_md,
            "executive_data": executive_data
        }
        
        with open(f"reports/dora_{safe_repo_name}_{timestamp}.json", "w", encoding="utf-8") as f:
            json.dump(result_payload, f)
            
        with open(f"reports/dora_{safe_repo_name}_{timestamp}.md", "w", encoding="utf-8") as f:
            f.write(report_md)
            
        yield f"data: {json.dumps({'type': 'done', 'result': result_payload})}\\n\\n"
        
    return StreamingResponse(generate(), media_type="text/event-stream")
