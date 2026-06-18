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
        print("Error: Falta la variable de entorno GITHUB_TOKEN en el archivo .env")
        sys.exit(1)
        
    if not os.getenv("GOOGLE_API_KEY"):
        print("Error: Falta la variable de entorno GOOGLE_API_KEY en el archivo .env")
        sys.exit(1)

    repo_name = input("Introduce el nombre del repositorio de GitHub (ej., 'langchain-ai/langchain'): ")
    
    print(f"\\nIniciando análisis de métricas DORA para {repo_name}... Esto puede tardar un momento.\\n")
    agent = create_dora_agent()
    
    try:
        response = agent.invoke({"repo_name": repo_name})
        print("\\n" + "="*50)
        print("RESULTADOS DEL ANÁLISIS DORA")
        print("="*50 + "\\n")
        print(response.get("output"))
    except Exception as e:
        print(f"Ocurrió un error durante el análisis: {e}")

if __name__ == "__main__":
    main()
