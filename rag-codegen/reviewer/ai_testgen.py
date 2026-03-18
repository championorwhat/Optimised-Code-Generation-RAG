import json
import os
from typing import List, Dict, Any

from huggingface_hub import InferenceClient


class AITestGenerator:
    """
    Uses an LLM (separate from code-generation model)
    to generate adversarial / edge test cases.
    """

    def __init__(
        self,
        model: str = "mistralai/Mistral-7B-Instruct-v0.2",
        temperature: float = 0.3,
        max_tokens: int = 512,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.client = InferenceClient(
            api_key=os.getenv("HF_API_KEY")
        )

    def generate_test_cases(
        self,
        problem_description: str,
        function_signature: str,
    ) -> List[Dict[str, Any]]:
        """
        Generate test cases using a chat-based LLM.

        Returns test cases WITHOUT expected outputs.
        """

        prompt = f"""
You are an expert software tester.

Given the following problem and function signature,
generate 3–5 diverse test cases as JSON.

Problem:
{problem_description}

Function signature:
{function_signature}

Return ONLY valid JSON in the following format:

[
  {{
    "name": "test_name",
    "input": {{
      "arg1": value,
      "arg2": value
    }}
  }}
]
"""

        try:
            # ✅ CORRECT: chat-based generation
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            raw_text = response.choices[0].message.content.strip()

            # Attempt to extract JSON safely
            json_start = raw_text.find("[")
            json_end = raw_text.rfind("]") + 1

            if json_start == -1 or json_end == -1:
                return []

            json_text = raw_text[json_start:json_end]
            test_cases = json.loads(json_text)

            # Ensure expected schema
            valid_tests = []
            for tc in test_cases:
                if "name" in tc and "input" in tc:
                    valid_tests.append(tc)

            return valid_tests

        except Exception as e:
            # Fail gracefully — reviewer must never crash pipeline
            print(f"[AI TESTGEN ERROR] {e}")
            return []
