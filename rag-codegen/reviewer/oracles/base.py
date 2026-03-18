from abc import ABC, abstractmethod
from typing import Any


class CanonicalOracle(ABC):
    """
    Base class for canonical oracles.
    """

    @abstractmethod
    def expected(self, **inputs) -> Any:
        """
        Returns the correct output for given inputs.
        """
        pass
