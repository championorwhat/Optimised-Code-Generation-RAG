import pickle

from ingestion.embedder import Embedder
from vectorstore.retriever import Retriever
from generation.llm_client import llm_client as LLMClient
from prompt.templates import code_generation_prompt
from prompt.normalizer import normalize_prompt
from postprocess.cleaner import clean_output


class RAGPipeline:
    def __init__(self):
        self.embedder = Embedder()
        self.llm = LLMClient()

        # Load persisted FAISS index
        with open("vectorstore/faiss_store.pkl", "rb") as f:
            index = pickle.load(f)

        self.retriever = Retriever(index)

    def run(self, user_task: str, language: str, use_rag: bool = True):
        """
        Executes the RAG / non-RAG pipeline with prompt normalization.

        Args:
            user_task (str): User-entered problem statement
            language (str): Programming language
            use_rag (bool): Whether to use retrieval augmentation

        Returns:
            dict: code, explanation, retrieved_context, use_rag
        """

        # -----------------------------
        # STEP 1: Normalize / infer intent
        # -----------------------------
        intent_data = normalize_prompt(user_task)

        inferred_constraints = ""
        if intent_data["constraints"]:
            inferred_constraints = "\n".join(
                f"- {c}" for c in intent_data["constraints"]
            )

        # -----------------------------
        # STEP 2: Retrieve context (if RAG enabled)
        # -----------------------------
        context = ""
        retrieved_chunks = []

        if use_rag:
            query_embedding = self.embedder.embed(user_task)[0]
            retrieved_chunks = self.retriever.retrieve(query_embedding, top_k=3)

            context = "\n\n".join(
                chunk["text"]
                for chunk in retrieved_chunks
                if chunk.get("language", "").lower() == language.lower()
            )

        # -----------------------------
        # STEP 3: Build final prompt
        # -----------------------------
        if inferred_constraints:
            context = (
                context
                + "\n\nINFERRED CONSTRAINTS:\n"
                + inferred_constraints
            )

        prompt = code_generation_prompt(
            user_task=user_task,
            language=language,
            context=context
        )

        # -----------------------------
        # STEP 4: LLM Generation
        # -----------------------------
        raw_output = self.llm.generate(prompt)

        # -----------------------------
        # STEP 5: Post-process output
        # -----------------------------
        cleaned = clean_output(raw_output)

        return {
            "code": cleaned["code"],
            "explanation": cleaned["explanation"],
            "retrieved_context": context,
            "use_rag": use_rag,
            "intent": intent_data["intent"]
        }
