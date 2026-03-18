import json
from datetime import datetime
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

def log_run(data: dict):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"run_{timestamp}.json"

    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return str(log_file)
