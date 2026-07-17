# 🧠 ClarityLoop

<div align="center">
  <p><strong>Stop guessing. Know before you build.</strong></p>
  <p>ClarityLoop is an open-source, multi-agent AI workspace built for founders, researchers, and engineers who value reality over AI hype. It stress-tests your ideas, uncovers hidden blockers, and generates actionable project plans before you write a single line of code.</p>
</div>

---

## ✨ Key Features

*   🤖 **Multi-Agent Feasibility Engine:** Every prompt is routed through a pipeline of 6 specialized AI agents (Requirement Analyst, Evidence Researcher, Resource Assessor, Skeptic Agent, Scope Agent, and Final Judge).
*   🛡️ **Honest Confidence Scores:** No hallucination tolerance. Scores are strictly computed based on verified evidence ratios.
*   📂 **Persistent Project Workspaces:** Convert any chat insight into a dedicated workspace.
*   ✅ **Task & Assumption Tracking:** Auto-generate execution steps from feasibility assessments, log unverified claims, and receive warnings if assumptions are later challenged.
*   🌿 **Branching Conversations:** Fork any message to explore alternative technical approaches side-by-side without losing your main thread.
*   🔒 **Local & Private:** Built-in support for running models 100% locally on your machine via **Ollama** (e.g., Llama 3.2), or use cloud providers like **Google Gemini**.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* (Optional) [Ollama](https://ollama.com/) for running local models

### 1. Start the Backend
Navigate to the backend directory, install the dependencies, and start the FastAPI server.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Configure your AI Provider
Create a `.env` file in the `backend/` directory:
```env
# For Gemini
GEMINI_API_KEY=your_api_key_here

# For Local Ollama
OLLAMA_ENABLED=true
```

### 3. Start the Frontend
In a new terminal, navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to launch ClarityLoop.

## 🛠 Tech Stack
* **Frontend:** Next.js, React, Framer Motion, Vanilla CSS (Premium Glassmorphism UI)
* **Backend:** FastAPI, Python, SQLite (Aiosqlite), SQLAlchemy
* **AI Orchestration:** Multi-agent pipeline architecture

## 🤝 Contributing
Contributions are welcome! Whether it's adding a new specialized AI agent to the pipeline, refining the UI, or fixing bugs, please open an issue or submit a pull request.
