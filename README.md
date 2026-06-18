# DORA Metrics Analyzer

DORA Metrics Analyzer is a comprehensive tool (CLI and Web) that allows you to calculate and analyze the DORA metrics (Deployment Frequency, Lead Time for Changes, Mean Time to Recovery, Change Failure Rate) of GitHub repositories. It uses Artificial Intelligence (Google Gemini) along with LangChain and the GitHub API to extract data, analyze it, and generate detailed reports.

## Features

- **DORA Metrics Analysis:** Automatically calculates the 4 key metrics of software delivery performance.
- **Integrated Artificial Intelligence:** Uses `gemini-2.5-flash` through LangChain to analyze Pull Requests, Releases, and Issues.
- **Command Line Interface (CLI):** Run quick analyses directly from the terminal (`main.py`).
- **Complete Web Application:**
  - Backend with FastAPI that supports Streaming (SSE) to view the analysis in real-time.
  - Modern frontend with React, Vite, TailwindCSS/Vanilla CSS, and Recharts to visualize data interactively.
- **Report History:** Automatically saves reports in JSON and Markdown format for later review.

## Project Structure

The project is divided into the following main areas:

- `main.py`: Entry point for the CLI.
- `backend.py`: FastAPI server that exposes the API endpoints.
- `dora_metrics/`: Python package containing the LangChain agent logic and tools to interact with GitHub.
- `frontend/`: SPA (Single Page Application) developed in React + Vite.
- `reports/`: Directory where the generated analyses are stored.
- `docs/`: Detailed project documentation.

## Documentation

For more detailed information, check the following documents in the `docs/` folder:

- [Setup and Installation](docs/setup.md)
- [System Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- A GitHub Personal Access Token (`GITHUB_TOKEN`)
- A Google Gemini API Key (`GOOGLE_API_KEY`)

## Quick Start (CLI)

1. Clone the repository and install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure your environment variables in a `.env` file:
   ```env
   GITHUB_TOKEN=your_github_token
   GOOGLE_API_KEY=your_google_api_key
   ```
3. Run the analysis from the terminal:
   ```bash
   python main.py
   ```

## License

This project is open-source.
