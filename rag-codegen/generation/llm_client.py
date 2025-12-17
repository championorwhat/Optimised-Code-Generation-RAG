import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from pathlib import Path

# Safe .env loading for Python 3.13
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

class llm_client:  # rename later to LLMClient
    def __init__(self):
        self.client = InferenceClient(
            api_key=os.getenv("HF_API_KEY")
        )

    def generate(self, prompt: str) -> str:
        completion = self.client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.2,
            top_p=0.9
        )
        return completion.choices[0].message.content
