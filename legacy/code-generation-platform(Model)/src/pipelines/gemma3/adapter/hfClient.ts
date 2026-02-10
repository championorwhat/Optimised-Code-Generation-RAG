// import fetch from 'node-fetch';
import { GenerateRequest, GenerateResponse } from './types';

const HF_API_URL = 'https://router.huggingface.co/hf-inference/models';

export class HuggingFaceGemmaClient {
  private apiToken: string;
  private modelId: string;

  constructor(apiToken: string, modelId: string) {
    this.apiToken = apiToken;
    this.modelId = modelId;
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const url = `${HF_API_URL}/${this.modelId}`;

    const body = {
      inputs: req.prompt,
      parameters: {
        max_new_tokens: req.maxTokens ?? 512,
        temperature: req.temperature ?? 0.7,
        top_p: req.topP ?? 0.95
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `HF Gemma-3-27B-it error ${response.status}: ${text}`,
      );
    }

    const json = await response.json();

    // HF text generation usually returns an array [{ generated_text: "..."}]
    const text =
      Array.isArray(json) && json[0]?.generated_text
        ? json[0].generated_text
        : JSON.stringify(json);

    // No direct token usage from basic endpoint, so put 0 for now
    return {
      text,
      finishReason: 'STOP',
      usage: {
        inputTokens: 0,
        outputTokens: 0
      }
    };
  }
}
