from pathlib import Path

def load_code_files(base_path="corpus"):
    documents = []

    for path in Path(base_path).rglob("*.py"):
        language = path.parts[1]      # python
        category = path.parts[2]      # arrays, strings, etc.

        with open(path, "r", encoding="utf-8") as f:
            code = f.read()

        documents.append({
            "text": code,
            "language": language,
            "category": category,
            "source": str(path)
        })

    return documents
