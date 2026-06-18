# DORA Metrics Analyzer

DORA Metrics Analyzer es una herramienta integral (CLI y Web) que permite calcular y analizar las métricas DORA (Deployment Frequency, Lead Time for Changes, Mean Time to Recovery, Change Failure Rate) de repositorios de GitHub. Utiliza Inteligencia Artificial (Google Gemini) junto con LangChain y la API de GitHub para extraer datos, analizarlos y generar informes detallados.

## Características

- **Análisis de Métricas DORA:** Calcula automáticamente las 4 métricas clave de rendimiento de entrega de software.
- **Inteligencia Artificial Integrada:** Utiliza `gemini-2.5-flash` a través de LangChain para analizar Pull Requests, Releases e Issues.
- **Interfaz de Línea de Comandos (CLI):** Ejecuta análisis rápidos directamente desde la terminal (`main.py`).
- **Aplicación Web Completa:** 
  - Backend con FastAPI que soporta Streaming (SSE) para ver el análisis en tiempo real.
  - Frontend moderno con React, Vite, TailwindCSS/Vanilla CSS y Recharts para visualizar los datos de forma interactiva.
- **Historial de Reportes:** Guarda automáticamente los informes en formato JSON y Markdown para su posterior revisión.

## Estructura del Proyecto

El proyecto se divide en las siguientes áreas principales:

- `main.py`: Punto de entrada para la CLI.
- `backend.py`: Servidor FastAPI que expone los endpoints de la API.
- `dora_metrics/`: Paquete Python que contiene la lógica del agente de LangChain y las herramientas para interactuar con GitHub.
- `frontend/`: Aplicación SPA (Single Page Application) desarrollada en React + Vite.
- `reports/`: Directorio donde se almacenan los análisis generados.
- `docs/`: Documentación detallada del proyecto.

## Documentación

Para obtener información más detallada, consulta los siguientes documentos en la carpeta `docs/`:

- [Instalación y Configuración (Setup)](docs/setup.md)
- [Arquitectura del Sistema](docs/architecture.md)
- [Documentación de la API](docs/api.md)

## Requisitos Previos

- Python 3.8 o superior
- Node.js 18 o superior
- Un token de acceso personal de GitHub (`GITHUB_TOKEN`)
- Una clave de API de Google Gemini (`GOOGLE_API_KEY`)

## Inicio Rápido (CLI)

1. Clona el repositorio e instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```
2. Configura tus variables de entorno en un archivo `.env`:
   ```env
   GITHUB_TOKEN=tu_token_de_github
   GOOGLE_API_KEY=tu_api_key_de_google
   ```
3. Ejecuta el análisis desde la terminal:
   ```bash
   python main.py
   ```

## Licencia

Este proyecto es de código abierto.
