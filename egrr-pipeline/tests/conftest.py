"""
Pytest configuration and fixtures.
"""

import pytest


@pytest.fixture
def sample_query() -> str:
    """Sample coding query for testing."""
    return "Create a function to validate email addresses in python"


@pytest.fixture
def sample_code() -> str:
    """Sample code for testing."""
    return '''
import re

def validate_email(email: str) -> bool:
    """Validate an email address."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
'''
