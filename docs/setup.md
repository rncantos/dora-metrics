# Configuración e Instalación

Esta guía te ayudará a poner en marcha el proyecto **DORA Metrics Analyzer** en tu entorno local.

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes:
- **Python 3.8+**
- **Node.js 18+** y **npm**
- Una cuenta de GitHub para generar un Personal Access Token.
- Una cuenta de Google Cloud / Google AI Studio para generar una API Key de Gemini.

## 1. Configuración del Backend

1. **Clonar el repositorio y navegar a la carpeta del proyecto:**
   ```bash
   git clone <url-del-repositorio>
   cd dora-metrics
   ```

2. **Crear y activar un entorno virtual (Recomendado):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Linux/Mac
   # En Windows: .\\venv\\Scripts\\activate
   ```

3. **Instalar las dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar las Variables de Entorno:**
   Copia el archivo de ejemplo y crea tu propio `.env`:
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` y añade tus credenciales:
   ```env
   GITHUB_TOKEN=tu_token_de_github_aqui
   GOOGLE_API_KEY=tu_api_key_de_google_aqui
   ```

## 2. Configuración del Frontend

1. **Navegar a la carpeta del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar las dependencias de Node.js:**
   ```bash
   npm install
   ```

## 3. Ejecución de la Aplicación

Para ejecutar la aplicación completa, necesitas iniciar tanto el servidor backend como el servidor de desarrollo frontend.

### Iniciar el Backend (Servidor API)
Abre una terminal en la raíz del proyecto (con el entorno virtual activado) y ejecuta:
```bash
uvicorn backend:app --reload --port 8000
```
El servidor backend estará disponible en `http://localhost:8000`.

### Iniciar el Frontend (Interfaz Web)
Abre otra terminal, navega a la carpeta `frontend` y ejecuta:
```bash
npm run dev
```
La aplicación web estará disponible, por lo general, en `http://localhost:5173`.

## Alternativa: Uso por CLI

Si solo deseas realizar pruebas rápidas desde la terminal sin interfaz gráfica, puedes usar el script `main.py` desde la raíz del proyecto:
```bash
python main.py
```
Sigue las instrucciones en pantalla para ingresar el nombre del repositorio a analizar.
