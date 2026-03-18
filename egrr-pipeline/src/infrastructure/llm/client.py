"""
Ollama Local LLM Client for EGRR Pipeline.

Provides deterministic, stateless text generation using Ollama's /api/generate endpoint.
Compatible interface with the previous HuggingFaceLLM client.
"""

import re
import asyncio
import httpx

from src.config.settings import get_settings

MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


class HuggingFaceLLM:
    """
    Local LLM client using Ollama.
    
    Named HuggingFaceLLM for backward compatibility with existing imports.
    Uses Ollama's /api/generate endpoint for plain text generation (no chat API).
    """

    def __init__(self) -> None:
        """Initialize the Ollama client."""
        settings = get_settings()
        
        self.base_url = settings.ollama_base_url
        self.model = settings.llm_model_id
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature
        self.seed = settings.llm_seed
        self.timeout = 300  # 5 minutes for long generations
        
        # Ollama chat endpoint (for instruction-tuned models)
        self.api_url = f"{self.base_url}/api/chat"
        
        print(f"Using LLM model: {self.model} (Ollama @ {self.base_url})")
        
        # Verify Ollama is running (non-blocking check not easily possible in init without asyncio run, 
        # so we'll skip the verification here or do it lazily)
        # Verify Ollama is running
        self._verify_connection()

    def _verify_connection(self) -> None:
        """Verify Ollama is running and model is available (Synchronous check)."""
        try:
            # Use synchronous client for init check
            with httpx.Client(timeout=2.0) as client:
                try:
                    response = client.get(f"{self.base_url}/api/tags")
                    response.raise_for_status()
                    models = response.json().get("models", [])
                except httpx.ConnectError:
                    print(f"CRITICAL WARNING: Cannot connect to Ollama at {self.base_url}")
                    print("Please run: 'ollama serve' in a separate terminal.")
                    return

            model_names = [m.get("name", "") for m in models]
            
            # Check if our model is available (handle tag variations)
            model_base = self.model.split(":")[0]
            available = any(model_base in name for name in model_names)
            
            if not available:
                print(f"Warning: Model '{self.model}' not found in Ollama.")
                print(f"Available models: {model_names}")
                print(f"Run: ollama pull {self.model}")
            else:
                print(f"SUCCESS: Connected to Ollama. Model '{self.model}' is available.")
                
        except Exception as e:
            print(f"Warning: Error checking Ollama connection: {e}")

    async def generate(self, prompt: str, max_tokens: int | None = None) -> str:
        """
        Generate text using Ollama's /api/chat endpoint asynchronously.
        Wraps a plain text prompt as a single user message.
        
        Args:
            prompt: The input prompt (plain text).
            max_tokens: Maximum tokens to generate.
            
        Returns:
            Generated text response.
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._chat(messages, max_tokens)

    async def _chat(self, messages: list[dict[str, str]], max_tokens: int | None = None, json_format: bool = False) -> str:
        """
        Send a chat completion request to Ollama's /api/chat endpoint.
        
        Args:
            messages: List of {role, content} chat messages.
            max_tokens: Maximum tokens to generate.
            json_format: If True, use Ollama's JSON format mode for structured output.
            
        Returns:
            Generated text response.
        """
        last_error = None
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,  # Get complete response
            "options": {
                "num_predict": max_tokens or self.max_tokens,
                "temperature": self.temperature,
                "seed": self.seed,  # For reproducibility
                "top_p": 0.9,
                "repeat_penalty": 1.1,
            }
        }
        
        if json_format:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(MAX_RETRIES):
                try:
                    response = await client.post(
                        self.api_url,
                        json=payload
                    )
                    
                    response.raise_for_status()
                    
                    result = response.json()
                    # /api/chat returns {message: {role, content}}
                    generated_text = result.get("message", {}).get("content", "")
                    
                    if not generated_text:
                        raise ValueError("Empty response from Ollama")
                    
                    return generated_text.strip()

                except httpx.TimeoutException:
                    last_error = TimeoutError(f"Request timed out after {self.timeout}s")
                    print(f"Attempt {attempt + 1}/{MAX_RETRIES}: Timeout, retrying...")
                except httpx.ConnectError as e:
                    last_error = e
                    print(f"Attempt {attempt + 1}/{MAX_RETRIES}: Connection error - is Ollama running?")
                except httpx.HTTPError as e:
                    last_error = e
                    print(f"Attempt {attempt + 1}/{MAX_RETRIES}: {e}")
                except Exception as e:
                    last_error = e
                    print(f"Attempt {attempt + 1}/{MAX_RETRIES}: {e}")
                
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))

        raise last_error or Exception("Failed to generate text")

    async def generate_json(
        self, 
        prompt_or_messages: str | list[dict[str, str]], 
        max_tokens: int | None = None
    ) -> str:
        """
        Generate JSON response with robust extraction logic asynchronously.
        
        Uses the /api/chat endpoint with proper chat message format for
        instruction-tuned models.
        
        Args:
            prompt_or_messages: Either a string prompt or list of chat messages.
                               Chat messages are passed DIRECTLY to the chat API.
            max_tokens: Maximum tokens to generate.
            
        Returns:
            Extracted JSON string.
        """
        # JSON constraint instruction (simpler since format:json enforces structure)
        constraint = (
            "\n\nYou MUST respond with ONLY a JSON object. "
            "Start with '{' and end with '}'. No other text."
        )
        
        # Build chat messages with proper roles
        if isinstance(prompt_or_messages, str):
            messages = [{"role": "user", "content": prompt_or_messages + constraint}]
        else:
            # Pass structured chat messages directly, append constraint to last user message
            messages = []
            for msg in prompt_or_messages:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            # Append JSON constraint to the last user message
            if messages and messages[-1]["role"] == "user":
                messages[-1]["content"] += constraint
            else:
                messages.append({"role": "user", "content": constraint})
            
        raw_response = (await self._chat(messages, max_tokens, json_format=True)).strip()
        
        # Robust JSON Extraction Strategy:
        
        # 1. Try to find content between ```json ... ```
        md_match = re.search(
            r"```json\s*(\{.*?\})\s*```", 
            raw_response, 
            re.DOTALL | re.IGNORECASE
        )
        if md_match:
            return md_match.group(1).strip()

        # 2. Try to find content between ANY ``` ... ```
        generic_md_match = re.search(
            r"```\s*(\{.*?\})\s*```", 
            raw_response, 
            re.DOTALL
        )
        if generic_md_match:
            return generic_md_match.group(1).strip()

        # 3. Try to find the outermost { and }
        first_brace = raw_response.find('{')
        last_brace = raw_response.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return raw_response[first_brace : last_brace + 1].strip()
        
        # 4. Return raw response if no JSON found (will likely fail parsing)
        return raw_response




