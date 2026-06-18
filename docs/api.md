# API Reference

The FastAPI backend exposes several endpoints that the frontend consumes to operate. Below is the documentation for these endpoints.

## Base URL
All API requests assume that the backend is running at the base URL. By default in local development: `http://localhost:8000`.

### Security & Rate Limiting

- **Rate Limit:** The streaming endpoint (`/api/analyze/stream`) is protected by `slowapi` and allows a maximum of **5 requests per minute** per IP address.
- **Input Validation:** The `repo_name` parameter must strictly match the regex `^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$`.
- **CORS:** Controlled by the `ALLOWED_ORIGINS` environment variable (defaults to `http://localhost:5173`).

---

## 1. Get Report History
Returns the list of all previously saved analyses.

- **URL:** `/api/history`
- **Method:** `GET`
- **Successful Response:**
  - **Code:** `200 OK`
  - **Content:** Array of JSON objects, where each object represents a complete report.

**Response Example:**
```json
[
  {
    "id": "20260618_120000",
    "repo_name": "facebook/react",
    "timestamp": "20260618_120000",
    "report": "# DORA Analysis for facebook/react\n...",
    "executive_data": {
      "df": "High",
      "ltc": "12.5h",
      "mttr": "Fast",
      "cfr": "5%",
      "pr_cycle_time": "24 hours",
      "chart_data": [{"name": "Jun", "releases": 3}]
    }
  }
]
```

---

## 2. Start Analysis (Streaming)
Starts a new DORA analysis of a GitHub repository. This endpoint uses Server-Sent Events (SSE) to send responses progressively, allowing the user interface to display the analysis as the AI model "thinks" and fetches data.

- **URL:** `/api/analyze/stream`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "repo_name": "owner/repository"
  }
  ```

### Executive Data Fields
| Field | Type | Description |
|-------|------|-------------|
| `df` | String | Deployment Frequency (e.g., "1.28/day"). |
| `ltc` | String | Lead Time for Changes (e.g., "16.8h"). |
| `mttr` | String | Mean Time to Recovery (e.g., "N/A" or "Fast"). |
| `cfr` | String | Change Failure Rate (e.g., "15%"). |
| `pr_cycle_time` | String | Average PR merge time (e.g., "24 hours"). |
| `chart_data` | Array | Objects containing `name` (date/label) and `releases` (count). |

### Streaming Format (SSE)
Events sent by the server follow the standard SSE format (`data: ...\n\n`).
The data (`data`) are JSON-encoded strings with the following types:

1. **Model Text (Content Generation):**
   ```json
   {"type": "text", "content": "The repository shows..."}
   ```
2. **Tool usage start:**
   ```json
   {"type": "tool_start", "tool": "fetch_recent_pull_requests"}
   ```
3. **Tool usage end:**
   ```json
   {"type": "tool_end", "tool": "fetch_recent_pull_requests"}
   ```
4. **Completion (Analysis finished):**
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
   {"type": "error", "content": "Detailed error message."}
   ```
