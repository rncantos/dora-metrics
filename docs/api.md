# Referencia de la API

El backend de FastAPI expone varios endpoints que el frontend consume para funcionar. A continuación, se detalla la documentación de estos endpoints.

## Base URL
Todas las peticiones a la API asumen que el backend está corriendo en la URL base. Por defecto en desarrollo local: `http://localhost:8000`.

---

## 1. Obtener Historial de Reportes
Retorna la lista de todos los análisis previamente guardados.

- **URL:** `/api/history`
- **Método:** `GET`
- **Respuesta Exitosa:**
  - **Código:** `200 OK`
  - **Contenido:** Array de objetos JSON, donde cada objeto representa un reporte completo.

**Ejemplo de Respuesta:**
```json
[
  {
    "id": "20260618_120000",
    "repo_name": "facebook/react",
    "timestamp": "20260618_120000",
    "report": "# Análisis DORA para facebook/react\\n...",
    "executive_data": {
      "df": "Alta",
      "ltc": "12.5h",
      "mttr": "Rápido",
      "cfr": "5%",
      "chart_data": [{"name": "Jun", "releases": 3}]
    }
  }
]
```

---

## 2. Iniciar Análisis (Streaming)
Inicia un nuevo análisis DORA de un repositorio en GitHub. Este endpoint utiliza Server-Sent Events (SSE) para enviar las respuestas progresivamente, permitiendo que la interfaz de usuario muestre el análisis a medida que el modelo de IA "piensa" y obtiene datos.

- **URL:** `/api/analyze/stream`
- **Método:** `POST`
- **Cuerpo (JSON):**
  ```json
  {
    "repo_name": "propietario/repositorio"
  }
  ```

### Formato de Streaming (SSE)
Los eventos enviados por el servidor siguen el formato estándar de SSE (`data: ...\\n\\n`).
Los datos (`data`) son strings codificados en JSON con los siguientes tipos:

1. **Texto del modelo (Generación de contenido):**
   ```json
   {"type": "text", "content": "El repositorio muestra..."}
   ```
2. **Inicio de uso de herramienta:**
   ```json
   {"type": "tool_start", "tool": "fetch_recent_pull_requests"}
   ```
3. **Fin de uso de herramienta:**
   ```json
   {"type": "tool_end", "tool": "fetch_recent_pull_requests"}
   ```
4. **Finalización (Análisis completado):**
   ```json
   {
     "type": "done",
     "result": {
       "id": "20260618_123000",
       "repo_name": "facebook/react",
       "timestamp": "20260618_123000",
       "report": "...",
       "executive_data": { ... }
     }
   }
   ```
5. **Error:**
   ```json
   {"type": "error", "content": "Mensaje de error detallado."}
   ```
