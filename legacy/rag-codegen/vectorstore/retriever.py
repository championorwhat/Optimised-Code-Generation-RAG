class Retriever:
    def __init__(self, index):
        self.index = index

    def retrieve(self, query_embedding, top_k=3):
        return self.index.search(query_embedding, top_k)
