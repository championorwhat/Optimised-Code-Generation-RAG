"""
Structured Logger Utility.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any

class JsonFormatter(logging.Formatter):
    """Format logs as JSON."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format the log record."""
        log_obj = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
        }
        
        # Add extra fields if present
        if hasattr(record, "props") and isinstance(record.props, dict): # type: ignore
            log_obj.update(record.props) # type: ignore
            
        return json.dumps(log_obj)

def setup_logger(name: str = "egrr_pipeline", level: int = logging.INFO) -> logging.Logger:
    """Configure and return a structured logger."""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(level)
        
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        
        # Prevent propagation to avoid double logging if root logger is configured
        logger.propagate = False
        
    return logger

def log_event(logger: logging.Logger, event: str, **kwargs: Any) -> None:
    """Helper to log structured events."""
    logger.info(event, extra={"props": kwargs})
