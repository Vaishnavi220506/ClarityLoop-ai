# **ClarityLoop**

> **Stop guessing. Know before you build.**

ClarityLoop is an open-source, multi-agent AI workspace that helps you evaluate an idea **before investing time, money, and effort into building it**.

Unlike regular AI assistants that immediately suggest solutions, ClarityLoop first checks whether an idea is actually practical. It examines technical requirements, searches for evidence, checks available resources, challenges weak assumptions, identifies hidden blockers, and converts the final assessment into an actionable project plan.

ClarityLoop is designed for **founders, researchers, students, developers, and engineers** who want realistic answers instead of AI-generated optimism.

## **Why ClarityLoop?**

Traditional AI assistants often provide confident solutions without checking whether those solutions can actually be implemented.

They may recommend:

- A dataset that does not exist or cannot be accessed
- An API that is expensive, restricted, or discontinued
- Hardware that is beyond the user’s available resources
- A model that requires more training data than is available
- A project scope that cannot be completed before the deadline
- A solution based on assumptions presented as facts

ClarityLoop takes a more realistic approach.

Before recommending that you build something, it asks:

- Is the idea technically possible?
- Are the required datasets and APIs available?
- Can the project run on the available hardware?
- Can it be completed within the available time and budget?
- Which claims are supported by evidence?
- Which parts of the idea are still assumptions?
- What could cause the project to fail?
- How can the scope be reduced without losing its value?

The final result is a structured feasibility assessment that clearly separates:

- What is verified
- What is uncertain
- What is missing
- What could go wrong
- What should be done next

## **How ClarityLoop Works**

Every complex request is passed through a pipeline of six specialized AI agents. Each agent examines the idea from a different perspective before the system produces its final decision.

### **1. Requirement Analyst**

The Requirement Analyst converts the user’s idea into clear and structured requirements.

It identifies:

- The problem being solved
- Expected features and outputs
- Technical requirements
- Data requirements
- External dependencies
- User constraints
- Success criteria

### **2. Evidence Researcher**

The Evidence Researcher checks whether the important claims behind the project are supported by reliable evidence.

It investigates:

- Dataset availability
- API availability
- Existing tools and technologies
- Research papers and documentation
- Similar projects and solutions
- Technical limitations
- Licensing and access restrictions

### **3. Resource Assessor**

The Resource Assessor determines whether the project can realistically be completed using the available resources.

It evaluates:

- Hardware requirements
- Software requirements
- Budget
- Development time
- Team size
- Required skills
- Storage and computing needs

### **4. Skeptic Agent**

The Skeptic Agent deliberately challenges the proposed idea.

It identifies:

- Hidden technical risks
- Unsupported assumptions
- Missing datasets
- Unrealistic expectations
- Possible data leakage
- Scalability problems
- Security and privacy concerns
- Reasons the project could fail

### **5. Scope Agent**

The Scope Agent reduces unnecessary complexity and converts an oversized idea into a realistic and achievable project.

It defines:

- The Minimum Viable Product
- Essential features
- Optional features
- Features that should be postponed
- A practical implementation path
- Alternative approaches when the original plan is not feasible

### **6. Final Judge**

The Final Judge combines the findings from all the agents and produces the final feasibility assessment.

The final report includes:

- Feasibility decision
- Evidence-based confidence score
- Verified facts
- Unverified assumptions
- Major risks and blockers
- Resource requirements
- Recommended project scope
- Actionable next steps

## **Multi-Agent Evaluation Pipeline**

```text
User Idea
    |
    v
Requirement Analyst
    |
    v
Evidence Researcher
    |
    v
Resource Assessor
    |
    v
Skeptic Agent
    |
    v
Scope Agent
    |
    v
Final Judge
    |
    v
Feasibility Report and Project Plan
```

## **Key Features**

### **Multi-Agent Feasibility Engine**

Instead of depending on a single AI-generated answer, ClarityLoop evaluates every complex idea using six specialized agents.

This allows the system to examine the same project from multiple perspectives and produce a more balanced, critical, and useful assessment.

### **Evidence-Based Confidence Scores**

ClarityLoop calculates confidence scores using the amount of verified evidence supporting the final assessment.

Unsupported claims do not silently increase the confidence score.

The system clearly distinguishes between:

- Verified facts
- Evidence-backed conclusions
- Reasonable estimates
- Unverified assumptions
- Missing information
- Conflicting evidence

### **Persistent Project Workspaces**

Important project insights should not disappear inside a long chat history.

ClarityLoop allows users to convert a feasibility assessment into a dedicated project workspace containing:

- Project goals
- Feasibility results
- Tasks and milestones
- Evidence and sources
- Risks and blockers
- Tracked assumptions
- Technical decisions
- Alternative approaches

### **Task and Assumption Tracking**

ClarityLoop automatically converts feasibility findings into actionable implementation tasks.

It also stores assumptions separately from verified facts. If new evidence later challenges an existing assumption, the system warns the user and highlights the parts of the project that may need to be reconsidered.

### **Branching Conversations**

Technical projects usually have more than one possible solution.

ClarityLoop allows users to fork any message and explore alternative approaches without losing the original conversation.

Users can create separate branches to compare:

- Cloud models and local models
- Different datasets
- Different technology stacks
- Machine learning and rule-based approaches
- High-cost and low-cost implementations
- Full-scale and minimum viable versions

### **Local and Private AI Support**

ClarityLoop supports local AI models through Ollama. This allows users to run supported models directly on their machines and keep sensitive project information private.

Users can also connect cloud-based providers such as Google Gemini when stronger models or online capabilities are required.

## **Getting Started**

### **Prerequisites**

Before running ClarityLoop, make sure the following software is installed:

- Node.js 18 or later
- Python 3.10 or later
- Git
- Ollama, if you want to use local AI models

## **1. Start the Backend**

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### **Activate the Virtual Environment**

On Linux or macOS:

```bash
source venv/bin/activate
```

On Windows Command Prompt:

```cmd
venv\Scripts\activate
```

On Windows PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend server:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

The FastAPI documentation will be available at:

```text
http://localhost:8000/docs
```

## **2. Configure the AI Provider**

Create a `.env` file inside the `backend` directory.

### **Using Google Gemini**

Add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### **Using Ollama**

Enable the local Ollama provider:

```env
OLLAMA_ENABLED=true
```

Before enabling Ollama, make sure it is installed and running.

Download a supported model:

```bash
ollama pull llama3.2
```

Start Ollama if it is not already running:

```bash
ollama serve
```

## **3. Start the Frontend**

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the following address in your browser:

```text
http://localhost:3000
```

ClarityLoop should now be running locally.

## **Technology Stack**

| **Layer** | **Technologies** |
|---|---|
| **Frontend** | Next.js, React, Framer Motion and Vanilla CSS |
| **Backend** | FastAPI and Python |
| **Database** | SQLite, aiosqlite and SQLAlchemy |
| **AI Orchestration** | Custom multi-agent pipeline architecture |
| **Cloud AI** | Google Gemini |
| **Local AI** | Ollama-supported models |
| **Interface** | Responsive glassmorphism-inspired design |

## **What Makes ClarityLoop Different?**

| **Traditional AI Assistant** | **ClarityLoop** |
|---|---|
| Immediately provides a solution | Evaluates feasibility before recommending a solution |
| May present assumptions as facts | Clearly identifies unverified assumptions |
| Produces one general response | Uses six specialized evaluation agents |
| Provides subjective confidence | Calculates confidence from verified evidence |
| Often ignores resource limitations | Checks hardware, budget, skills and time |
| Conversations remain isolated | Converts insights into project workspaces |
| Gives a static answer | Tracks tasks, risks and changing assumptions |
| Focuses only on what could work | Also investigates why the idea could fail |

## **Future Improvements**

Planned improvements include:

- Support for additional AI providers
- More specialized evaluation agents
- Improved evidence verification
- Project comparison dashboards
- Team collaboration features
- Exportable feasibility reports
- Advanced project risk tracking
- Custom evaluation pipelines
- Improved local-model performance
- Integration with development and project-management tools

## **Contributing**

ClarityLoop is open source, and contributions are welcome.

You can contribute by:

- Creating new specialized agents
- Improving the feasibility evaluation process
- Adding support for more AI providers
- Strengthening evidence verification
- Improving confidence-score calculations
- Refining the user interface
- Fixing bugs
- Improving documentation
- Suggesting new features

To contribute:

1. Fork the repository
2. Create a new branch
3. Make and test your changes
4. Commit your work
5. Push the branch
6. Open a pull request

You can also open an issue to report a bug, request a feature, or suggest an improvement.

## **License**

This project is open source and distributed under the license included in the repository.

See the `LICENSE` file for more information.

## **The Principle Behind ClarityLoop**

> **A useful AI should not simply tell you that an idea is possible. It should show you what is proven, expose what is uncertain, and help you decide whether the idea is worth building.**

<p align="center">
  <strong>ClarityLoop helps you fail on paper before you fail in production.</strong>
</p>
