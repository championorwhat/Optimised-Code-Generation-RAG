"""
Retrieval Phase (Phase 1 & 4).
"""

import json

from src.domain.entities import CodeExample, ExecutionResult, RetrievalQuery
from src.infrastructure.llm.client import HuggingFaceLLM
from src.infrastructure.llm.prompt_builder import PromptBuilder
from src.infrastructure.vectordb.retriever import CodeRetriever


class RetrievalPhase:
    """Handles retrieval of code patterns from the knowledge base."""

    def __init__(self) -> None:
        """Initialize dependencies."""
        self.llm = HuggingFaceLLM()
        self.prompt_builder = PromptBuilder()
        self.retriever = CodeRetriever()

    async def execute_intent_based(self, user_query: str, iteration: int = 1) -> tuple[list[RetrievalQuery], list[CodeExample]]:
        """
        Phase 1: Generate retrieval queries based on user intent and retrieve docs w/ async calls.
        """
        # 1. Generate Queries via LLM
        prompt = self.prompt_builder.build_retrieval_prompt(user_query, iteration)
        response_text = await self.llm.generate_json(prompt)
        
        queries = self._parse_queries(response_text)
        
        # 2. Retrieve Documents
        context_docs = await self._retrieve_for_queries(queries)
        
        return queries, context_docs

    async def execute_execution_grounded(self, execution_result: ExecutionResult) -> tuple[list[RetrievalQuery], list[CodeExample]]:
        """
        Phase 4: Generate queries based on execution feedback (errors, coverage) w/ async calls.
        """
        # 1. Generate Queries via LLM
        prompt = self.prompt_builder.build_reretrieval_prompt(execution_result)
        response_text = await self.llm.generate_json(prompt)
        
        queries = self._parse_queries(response_text)
        
        # 2. Retrieve Documents
        context_docs = await self._retrieve_for_queries(queries)
        
        return queries, context_docs

    def _parse_queries(self, json_text: str | dict) -> list[RetrievalQuery]:
        """Parse LLM JSON response into RetrievalQuery objects."""
        try:
            # Handle if already a dict
            if isinstance(json_text, dict):
                data = json_text
            else:
                # Basic cleanup if LLM adds markdown blocks
                cleaned_text = json_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text.replace("```json", "").replace("```", "")
                data = json.loads(cleaned_text)
            
            query_dicts = data.get("retrieval_queries", [])
            if isinstance(query_dicts, dict):
                query_dicts = [query_dicts]
            elif not isinstance(query_dicts, list):
                query_dicts = []
                
            return [RetrievalQuery(**q) for q in query_dicts if isinstance(q, dict)]

            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing retrieval queries: {e}\nResponse: {json_text}")
            # Fallback: if parsing fails, maybe return a generic query? 
            # For now, return empty to be safe or raise/log.
            return []

    async def _retrieve_for_queries(self, queries: list[RetrievalQuery]) -> list[CodeExample]:
        """Run vector search for a list of queries and deduplicate results asynchronously."""
        all_docs = {}  # Map id -> CodeExample
        
        # Parallel execution of all searches
        # This gives a massive speedup when we have multiple queries (e.g., 3-5 queries)
        import asyncio
        search_tasks = [self.retriever.search(q.query, top_k=3) for q in queries]
        results_list = await asyncio.gather(*search_tasks)
        
        for docs in results_list:
            for doc in docs:
                if doc.id not in all_docs:
                    all_docs[doc.id] = doc
                else:
                    # Keep the one with higher score if duplicate? 
                    # Or just keep first found. 
                    pass
                    
        return list(all_docs.values())
