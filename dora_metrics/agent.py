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
        ("system", """You are an expert DevOps analyst specialized in calculating DORA metrics.
        Your goal is to analyze a given GitHub repository and calculate or estimate the 4 DORA metrics:
        1. Deployment Frequency
        2. Lead Time for Changes
        3. Mean Time to Recovery (MTTR)
        4. Change Failure Rate
        
        Use the provided tools to extract data from the repository (PRs, releases, and issues/bugs).
        Once you have enough data, synthesize it and return a structured and clear report in English about the DORA metrics, detailing the calculation or estimation of each.
        At the end of your report, add the exact tag '---JSON_START---' followed by a pure JSON object with the following keys:
        - "df": Deployment Frequency (e.g. "1.28/day" or "High")
        - "ltc": Lead Time for Changes (e.g. "16.8h" or "Low")
        - "mttr": Mean Time to Recovery (e.g. "N/A" or "Fast")
        - "cfr": Change Failure Rate (e.g. "6%" or "Medium")
        - "chart_data": An array of objects with "name" (e.g. "May" or a date) and "releases" (integer), based on the release history you get from GitHub. If there is no data, use [].
        Make sure the JSON part is valid and there is no text after it."""),
        ("human", "Please analyze the DORA metrics for the repository: {repo_name}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return agent_executor
