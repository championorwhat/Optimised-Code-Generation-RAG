"""
Value objects and enumerations for the domain layer.
"""

from enum import Enum


class PipelinePhase(str, Enum):
    """Phases of the EGRR pipeline."""

    RETRIEVAL = "retrieval"
    GENERATION = "generation"
    EXECUTION = "execution"
    RE_RETRIEVAL = "re-retrieval"
    REVIEW = "review"
    DECISION = "decision"


class ExecutionStatus(str, Enum):
    """Status of code execution."""

    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"


class ReviewStatus(str, Enum):
    """Status of a review aspect."""

    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"


class DecisionType(str, Enum):
    """Types of decisions made by the pipeline."""

    CONTINUE = "continue"
    TERMINATE_SUCCESS = "terminate_success"
    TERMINATE_MAX_ITERATIONS = "terminate_max_iterations"


class ChangeType(str, Enum):
    """Types of changes made during repair."""

    FIX = "fix"
    ENHANCEMENT = "enhancement"
    SECURITY = "security"
