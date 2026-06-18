# Arquitectura del Sistema

El proyecto **DORA Metrics Analyzer** está diseñado utilizando una arquitectura cliente-servidor, con un enfoque impulsado por Inteligencia Artificial para el análisis de datos de repositorios de código.

## Componentes Principales

### 1. Backend (Python / FastAPI)
El backend actúa como la capa de orquestación y exposición de servicios.
- **Framework:** FastAPI. Se eligió por su alto rendimiento, soporte nativo para operaciones asíncronas y facilidad para crear APIs REST.
- **Agente de IA (`dora_metrics.agent`):** Utiliza LangChain y el modelo `gemini-2.5-flash` de Google. El agente está configurado con un prompt específico (analista DevOps) y tiene acceso a herramientas ("Tools") para hacer consultas a GitHub.
- **Herramientas de GitHub (`dora_metrics.tools.github_tools`):** Funciones que utilizan `PyGithub` para extraer:
  - Pull Requests recientes.
  - Releases / Lanzamientos recientes.
  - Issues (para identificar bugs y calcular MTTR/CFR).
- **Streaming de Respuestas:** El endpoint `/api/analyze/stream` utiliza Server-Sent Events (SSE) para enviar el proceso de pensamiento del LLM al cliente en tiempo real a medida que se generan los tokens.

### 2. Frontend (React / Vite)
La interfaz de usuario está diseñada para proporcionar una experiencia rica e interactiva.
- **Framework:** React con Vite como bundler (para un desarrollo rápido).
- **Visualización de Datos:** Se utiliza `recharts` para mostrar gráficos (ej. Frecuencia de Despliegues en el tiempo).
- **Procesamiento de Markdown:** Se utiliza `react-markdown` para renderizar el informe detallado generado por la IA de forma presentable.
- **Exportación:** Se usa `html2pdf.js` para permitir la exportación de los informes a formato PDF.

### 3. Almacenamiento Local
- **Reportes (`reports/`):** Cada vez que se completa un análisis a través de la interfaz web, el sistema guarda dos archivos localmente:
  - Un archivo `.json` con los datos estructurados (Métricas clave y datos para el gráfico).
  - Un archivo `.md` con el texto completo del informe generado por la IA.
- Esto permite la funcionalidad de "Historial" donde los usuarios pueden consultar análisis previos sin gastar tokens de la API.

## Flujo de Ejecución (Web)

1. El usuario introduce un repositorio (ej. `facebook/react`) en el Frontend.
2. El Frontend abre una conexión SSE hacia `GET /api/analyze/stream` (o mediante POST si el cliente lo implementa así, actualmente es POST).
3. FastAPI inicializa el Agente de LangChain.
4. El Agente decide qué herramientas ejecutar basándose en el prompt. Llama a las APIs de GitHub mediante las herramientas.
5. GitHub devuelve los datos solicitados.
6. El Agente sintetiza la información, calcula estimaciones de las métricas DORA y comienza a generar el texto en streaming.
7. El Backend transmite los tokens generados al Frontend y eventos del uso de herramientas (ej. `tool_start`, `tool_end`).
8. Una vez finalizado, el Backend detecta el separador `---JSON_START---`, extrae la información ejecutiva (estructurada) y guarda el reporte en disco.
9. El Frontend finaliza la conexión y muestra los resultados interactivos.
