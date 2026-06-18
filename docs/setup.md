# Setup and Installation

This guide will help you get the **DORA Metrics Analyzer** project running in your local environment.

## Prerequisites

Make sure you have the following components installed:
- **Python 3.10+**
- **Node.js 24+** and **npm**
- A GitHub Personal Access Token (classic)
- A Google Gemini API Key

## 1. Backend Configuration

1. **Clone the repository and navigate to the project folder:**
   ```bash
   git clone <repository-url>
   cd dora-metrics
   ```

2. **Create and activate a virtual environment (Recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/Mac
   # On Windows: .\\venv\\Scripts\\activate
   ```

3. **Install the Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy the example file and create your own `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and add your credentials:
   ```env
   GITHUB_TOKEN=your_github_token_here
   GOOGLE_API_KEY=your_google_api_key_here
   ```

## 2. Frontend Configuration

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

## Testing & Quality Assurance

To ensure system stability, run the test suites and code coverage tools.

### Backend Tests
```bash
pytest --cov=. --cov-report=term
```
*Note: The CI pipeline runs `Bandit` as an additional SAST security scan.*

### Frontend Tests
```bash
cd frontend
npm run coverage
```

## Running the Application

To run the full application, you need to start both the backend server and the frontend development server.

### Start the Backend (API Server)
Open a terminal in the root of the project (with the virtual environment activated) and run:
```bash
uvicorn backend:app --reload --port 8000
```
The backend server will be available at `http://localhost:8000`.

### Start the Frontend (Web Interface)
Open another terminal, navigate to the `frontend` folder, and run:
```bash
npm run dev
```
The web application will be available, usually at `http://localhost:5173`.

## Alternative: CLI Usage

If you only want to perform quick tests from the terminal without a graphical interface, you can use the `main.py` script from the project root:
```bash
python main.py
```
Follow the on-screen instructions to enter the repository name to analyze.
