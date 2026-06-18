from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import create_tool_calling_agent, AgentExecutor
from dora_metrics.tools.github_tools import (
    fetch_recent_pull_requests,
    fetch_recent_releases,
    fetch_recent_issues
)

def create_dora_agent():
    # Asegúrate de tener GOOGLE_API_KEY en tu entorno o en el archivo .env
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    
    tools = [
        fetch_recent_pull_requests,
        fetch_recent_releases,
        fetch_recent_issues
    ]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un experto analista DevOps especializado en calcular las métricas DORA.
        Tu objetivo es analizar un repositorio de GitHub dado y calcular o estimar las 4 métricas DORA:
        1. Deployment Frequency (Frecuencia de Despliegue)
        2. Lead Time for Changes (Tiempo de entrega para cambios)
        3. Mean Time to Recovery (Tiempo medio de recuperación - MTTR)
        4. Change Failure Rate (Tasa de fallos en cambios)
        
        Usa las herramientas proporcionadas para extraer datos del repositorio (PRs, releases y problemas/bugs).
        Una vez que tengas suficientes datos, sintetízalos y devuelve un informe estructurado y claro en español sobre las métricas DORA, detallando el cálculo o estimación de cada una.
        Al final de tu informe, añade la etiqueta exacta '---JSON_START---' seguida de un objeto JSON puro con las siguientes claves:
        - "df": Frecuencia de Despliegue (ej. "1.28/día" o "Alta")
        - "ltc": Lead Time for Changes (ej. "16.8h" o "Bajo")
        - "mttr": Mean Time to Recovery (ej. "N/A" o "Rápido")
        - "cfr": Change Failure Rate (ej. "6%" o "Medio")
        - "chart_data": Un array de objetos con "name" (ej. "Mayo" o una fecha) y "releases" (número entero), basado en el histórico de lanzamientos que obtengas de GitHub. Si no hay datos, usa [].
        Asegúrate de que la parte del JSON sea válida y no haya texto después de ella."""),
        ("human", "Por favor analiza las métricas DORA para el repositorio: {repo_name}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return agent_executor
