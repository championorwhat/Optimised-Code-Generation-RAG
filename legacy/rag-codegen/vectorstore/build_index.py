import pickle
from ingestion.loader import load_code_files
from ingestion.chunker import chunk_code
from ingestion.embedder import Embedder
from vectorstore.faiss_index import FAISSIndex

def build_and_save_index():
    embedder = Embedder()
    documents = load_code_files()

    chunks = []
    for doc in documents:
        chunks.extend(chunk_code(doc))

    texts = [c["text"] for c in chunks]
    embeddings = embedder.embed(texts)

    index = FAISSIndex(dim=embeddings.shape[1])
    index.add(embeddings, chunks)

    with open("vectorstore/faiss_store.pkl", "wb") as f:
        pickle.dump(index, f)

    print("FAISS index built and saved.")

if __name__ == "__main__":
    build_and_save_index()
