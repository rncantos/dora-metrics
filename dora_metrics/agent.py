from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import create_tool_calling_agent, AgentExecutor
from dora_metrics.tools.github_tools import (
    fetch_recent_pull_requests,
    fetch_recent_releases,
    fetch_recent_issues
)

def create_dora_agent():
    # Make sure you have GOOGLE_API_KEY in your environment or .env file
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    
    tools = [
        fetch_recent_pull_requests,
        fetch_recent_releases,
        fetch_recent_issues
    ]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert DevOps engineer and executive auditor specializing in DORA metrics.
Your objective is to analyze a given GitHub repository and calculate the 4 key DORA metrics plus PR Cycle Time.
CRITICAL INSTRUCTION: You MUST write the entire report and all output in ENGLISH ONLY. Do not use Spanish or any other language.
CRITICAL INSTRUCTION 2: YOU MUST CALL ALL THREE TOOLS (`fetch_recent_pull_requests`, `fetch_recent_releases`, `fetch_recent_issues`) TO GATHER REAL DATA BEFORE WRITING THE REPORT. DO NOT HALLUCINATE OR INVENT DATA.

1. Deployment Frequency
2. Lead Time for Changes
3. Mean Time to Recovery (MTTR)
4. Change Failure Rate: Determine the percentage of deployments causing a failure in production. You can approximate this by finding the ratio of issues labeled 'bug' or 'incident' to the total number of deployments (releases/tags).
5. PR Cycle Time: Calculate the average time it takes for a Pull Request to be merged (from creation to merge date).
        
Use the provided tools to extract data from the repository (PRs, releases, and issues/bugs).
Once you have enough data, synthesize it and return a structured and clear report in English about the DORA metrics, detailing the calculation or estimation of each.
Crucially, you MUST conclude the report with a section titled "## Actionable Insights" containing exactly 3 highly specific, technical, and actionable bullet points on how to improve the repository's weakest metric.
        
After the report, add the separator "---JSON_START---" and output a valid JSON object with the following keys:
        - "df": Deployment Frequency (e.g. "1.28/day" or "High")
        - "ltc": Lead Time for Changes (e.g. "16.8h" or "Low")
        - "mttr": Mean Time to Recovery (e.g. "N/A" or "Fast")
        - "cfr": Change Failure Rate (e.g. "5%" or "Low")
        - "pr_cycle_time": PR Cycle Time (e.g. "24.5h" or "Medium")
        - "trend_data": A JSON array of 6 objects representing a 6-month trailing historical trend for PR Cycle Time. Each object must have: {{"month": "Jan", "cycle_time": 24}}. Base it on real data if available, or generate a realistic trailing estimation that culminates in the current PR Cycle time.
        - "chart_data": A JSON array of the 5 metrics with numeric 'value' and 'fullMark': [{{"subject": "DF", "value": 80, "fullMark": 100}}, {{"subject": "LTC", "value": 60, "fullMark": 100}}, {{"subject": "MTTR", "value": 90, "fullMark": 100}}, {{"subject": "CFR", "value": 70, "fullMark": 100}}, {{"subject": "PR Cycle", "value": 65, "fullMark": 100}}]
        Make sure the JSON is perfectly valid. Do not use markdown blocks for the JSON."""),
        ("human", "Please analyze the DORA metrics for the repository: {repo_name}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return agent_executor
