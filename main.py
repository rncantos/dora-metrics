import warnings
import os
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ["PYTHONWARNINGS"] = "ignore"

import sys
from dotenv import load_dotenv
from dora_metrics.agent import create_dora_agent

def main():
    load_dotenv()
    
    if not os.getenv("GITHUB_TOKEN"):
        print("Error: Missing GITHUB_TOKEN environment variable in .env file")
        sys.exit(1)
        
    if not os.getenv("GOOGLE_API_KEY"):
        print("Error: Missing GOOGLE_API_KEY environment variable in .env file")
        sys.exit(1)

    repo_name = input("Enter the GitHub repository name (e.g., 'langchain-ai/langchain'): ")
    
    print(f"\\nStarting DORA metrics analysis for {repo_name}... This may take a moment.\\n")
    agent = create_dora_agent()
    
    try:
        response = agent.invoke({"repo_name": repo_name})
        print("\\n" + "="*50)
        print("DORA ANALYSIS RESULTS")
        print("="*50 + "\\n")
        print(response.get("output"))
    except Exception as e:
        print(f"An error occurred during the analysis: {e}")

if __name__ == "__main__":
    main()
