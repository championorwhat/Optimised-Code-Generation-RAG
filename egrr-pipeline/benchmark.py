"""
Benchmark Script for EGRR Pipeline.
"""

import time
import httpx
import asyncio

API_URL = "http://localhost:8000/api/generate"
# Use a query that requires retrieval and some thinking
QUERY = "Create a Python class for a ThreadSafe Singleton pattern with double-checked locking."

async def run_benchmark():
    print(f"Running benchmark on: {API_URL}")
    print(f"Query: {QUERY}")
    print("-" * 50)
    
    # Warmup / First run (might be uncached)
    start = time.time()
    print("Run 1 (Cold/Warmup)...", end=" ", flush=True)
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                API_URL, 
                json={"query": QUERY, "max_iterations": 3}
            )
            response.raise_for_status()
            data = response.json()
            
        duration = time.time() - start
        print(f"Done in {duration:.2f}s")
        print(f"Status: {data.get('status')}")
        print(f"Iterations: {data.get('iterations')}")
        
    except Exception as e:
        print(f"FAILED: {e}")
        return

    print("-" * 50)
    
    # Second run (Should be cached if query is identical)
    # Actually, the pipeline generates new queries each time, but the underlying vector search
    # might cache the embeddings of the generated queries if they match exactly.
    # LLM generation is non-deterministic, so queries might differ slightly.
    # BUT, to test embedding caching, we can rely on the fact that similar words will be embedded.
    
    start = time.time()
    print("Run 2 (Cached Embeddings)...", end=" ", flush=True)
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                API_URL, 
                json={"query": QUERY, "max_iterations": 3}
            )
            response.raise_for_status()
            
        duration = time.time() - start
        print(f"Done in {duration:.2f}s")
        
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
