<p align="center">
  <img src="docs/assets/dora_dashboard.jpg" alt="DORA Metrics Analyzer Dashboard" width="800" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
</p>

<h1 align="center">🚀 DORA Metrics Analyzer</h1>

<p align="center">
  <strong>The Ultimate AI-Powered DevOps Intelligence Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Node.js-24-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/AI-Google_Gemini-FF6F00?style=for-the-badge&logo=google" alt="Google Gemini">
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License">
</p>

<p align="center">
  Unlock elite engineering performance. Calculate, visualize, and analyze your DORA Metrics (Deployment Frequency, Lead Time, MTTR, CFR) completely automatically through the GitHub API and advanced LLM reasoning.
</p>

---

## ✨ The WOW Factor

Traditional dashboards just show you raw numbers. **DORA Metrics Analyzer** is different. By natively integrating **Google Gemini 2.5 Flash** through LangChain, we don't just calculate your metrics; we *read* your Pull Requests, *understand* your release notes, and *detect* exactly which deploys caused regressions.

- **🌌 Stunning Glassmorphism UI:** Built with React, Vite, and Recharts. An interface so sleek and responsive your engineering team will actually *want* to check their metrics.
- **📄 Enterprise PDF Exports:** Generate breathtaking, highly corporate PDF reports directly from the browser. Complete with vectorized charts, beautiful cover pages, and recurring footers.
- **⚡ Real-Time Streaming (SSE):** Watch your AI analysis stream live onto the screen. No more staring at loading spinners while the LLM thinks.
- **🛡️ Enterprise Security First:** Hardened with SlowAPI Rate Limiting, strict Pydantic validations, and Bandit SAST checks on every commit.

## 📊 Core Features

| Feature | Description |
|---|---|
| **Deployment Frequency** | Accurately calculates how often your team successfully releases to production. |
| **Lead Time for Changes** | Measures the exact time from the first commit to production deployment. |
| **Change Failure Rate** | AI automatically correlates your incident reports to your releases. |
| **Mean Time to Recovery** | Measures how quickly your team bounces back from a failure. |
| **PR Cycle Time** | Analyzes code review bottlenecks to speed up your pipeline. |

## 🚀 Quick Start

Get your elite DevOps dashboard running locally in under 2 minutes.

### 1. Prerequisites
- Python 3.10+ and Node.js 24+
- `GITHUB_TOKEN` (for repository access)
- `GOOGLE_API_KEY` (for Gemini AI analysis)

### 2. Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/rncantos/dora-metrics.git
cd dora-metrics
```

**Backend:**
```bash
pip install -r requirements.txt
cp .env.example .env # Add your keys here
uvicorn backend:app --reload
```

**Frontend:**
```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` and prepare to be amazed.

## 📚 Documentation

Dive deeper into our architecture, API, and setup guides:
- 📖 [Setup and Installation Guide](docs/setup.md)
- 🏗️ [System Architecture](docs/architecture.md)
- 🔌 [API Documentation](docs/api.md)
- 🤝 [Contributing Guidelines](CONTRIBUTING.md)

## 📝 License

Designed and engineered with ❤️. Licensed under the [MIT License](LICENSE).
