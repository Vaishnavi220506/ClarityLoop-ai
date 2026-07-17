ClarityLoop

Stop guessing. Know before you build.

ClarityLoop is an open-source, multi-agent AI workspace designed for founders, researchers, students, and engineers who value realistic analysis over AI-generated optimism.

It evaluates ideas before development begins by testing their feasibility, identifying hidden blockers, verifying assumptions, and converting the results into actionable project plans.

Key Features
Multi-Agent Feasibility Engine

Every complex request is evaluated through a pipeline of six specialized AI agents:

Requirement Analyst
Evidence Researcher
Resource Assessor
Skeptic Agent
Scope Agent
Final Judge

Each agent examines the idea from a different perspective before the system produces its final assessment.

Evidence-Based Confidence Scores

ClarityLoop calculates confidence scores using the proportion of claims supported by verified evidence. Unverified assumptions are clearly identified instead of being presented as facts.

Persistent Project Workspaces

Convert useful conversations and feasibility assessments into dedicated project workspaces where plans, tasks, evidence, and assumptions can be managed together.

Task and Assumption Tracking

Automatically generate implementation tasks from feasibility assessments, record unverified assumptions, and receive warnings when new evidence challenges an existing assumption.

Branching Conversations

Fork any message to explore alternative technologies, architectures, datasets, or implementation approaches without losing the original conversation.

Local and Private AI Support

Run ClarityLoop locally using Ollama-supported models, such as Llama 3.2, or connect it to cloud-based providers such as Google Gemini.

Getting Started
Prerequisites

Ensure the following software is installed:

Node.js 18 or later
Python 3.10 or later
Ollama (optional, for running local AI models)
1. Start the Backend

Navigate to the backend directory:

cd backend

Create a Python virtual environment:

python -m venv venv

Activate the virtual environment.

On Linux or macOS:

source venv/bin/activate

On Windows:

venv\Scripts\activate

Install the required dependencies:

pip install -r requirements.txt

Start the FastAPI server:

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

The backend will be available at:

http://localhost:8000
2. Configure the AI Provider

Create a .env file inside the backend directory.

To use Google Gemini:

GEMINI_API_KEY=your_api_key_here

To use Ollama:

OLLAMA_ENABLED=true

Make sure Ollama is installed, running, and has a supported model available before enabling the local provider.

3. Start the Frontend

Open a new terminal and navigate to the frontend directory:

cd frontend

Install the frontend dependencies:

npm install

Start the development server:

npm run dev

Open the following address in your browser:

http://localhost:3000
Technology Stack
Frontend
Next.js
React
Framer Motion
Vanilla CSS
Glassmorphism-based user interface
Backend
FastAPI
Python
SQLite
aiosqlite
SQLAlchemy
AI Orchestration
Multi-agent pipeline architecture
Google Gemini integration
Local Ollama model support
Contributing

Contributions are welcome. You can contribute by:

Adding new specialized agents
Improving feasibility evaluation methods
Refining the user interface
Adding support for more AI providers
Improving documentation
Reporting and fixing bugs

To contribute, open an issue describing the proposed change or submit a pull request with your implementation.

Project Goal

ClarityLoop is built around a simple principle:

Before committing time and resources to an idea, understand what is feasible, what is uncertain, and what could prevent it from succeeding.
