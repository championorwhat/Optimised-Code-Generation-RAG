from src.infrastructure.vectordb.indexer import CodeCorpusIndexer

if __name__ == "__main__":
    indexer = CodeCorpusIndexer()
    indexer.build_index()
    print("Corpus rebuilding complete with new patterns.")
