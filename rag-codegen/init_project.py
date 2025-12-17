import os

BASE_DIRS = [
    "config",
    "ingestion",
    "vectorstore",
    "prompt",
    "generation",
    "postprocess",
    "pipeline"
]

FILES = {
    "config": ["hf_config.py", "model_config.py"],
    "ingestion": ["loader.py", "chunker.py", "embedder.py"],
    "vectorstore": ["faiss_index.py", "retriever.py"],
    "prompt": ["templates.py", "formatter.py"],
    "generation": ["gemma_client.py", "inference.py"],
    "postprocess": ["cleaner.py", "validator.py"],
    "pipeline": ["rag_pipeline.py"],
    "": ["main.py", "requirements.txt", ".env"]
}

def create_structure():
    for d in BASE_DIRS:
        os.makedirs(d, exist_ok=True)

    for folder, files in FILES.items():
        for f in files:
            path = os.path.join(folder, f) if folder else f
            if not os.path.exists(path):
                open(path, "w").close()

if __name__ == "__main__":
    create_structure()
    print("RAG codegen project structure created.")
