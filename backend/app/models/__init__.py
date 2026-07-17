"""
ClarityLoop – All SQLAlchemy ORM Models
Imports all model modules so SQLAlchemy can discover them for migrations.
"""
from app.models.user import User, UserPreference, ResourceProfile  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.conversation import Conversation, Branch, Message  # noqa: F401
from app.models.task import Task, TaskDependency  # noqa: F401
from app.models.evidence import Evidence, Claim, Citation  # noqa: F401
from app.models.assumption import Assumption  # noqa: F401
from app.models.feasibility import FeasibilityAssessment, AssessmentVersion  # noqa: F401
from app.models.decision import Decision  # noqa: F401
from app.models.file import UploadedFile  # noqa: F401
from app.models.agent_run import AgentRun  # noqa: F401
from app.models.canvas import WorkflowNode, WorkflowEdge  # noqa: F401
from app.models.focus import FocusSession  # noqa: F401

all_models = [
    User, UserPreference, ResourceProfile,
    Project,
    Conversation, Branch, Message,
    Task, TaskDependency,
    Evidence, Claim, Citation,
    Assumption,
    FeasibilityAssessment, AssessmentVersion,
    Decision,
    UploadedFile,
    AgentRun,
    WorkflowNode, WorkflowEdge,
    FocusSession,
]
