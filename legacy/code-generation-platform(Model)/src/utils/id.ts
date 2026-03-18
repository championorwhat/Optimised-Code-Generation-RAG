// src/utils/id.ts

export function generateRunId(): string {
    // Simple, collision-resistant enough for your use case
    const random = Math.random().toString(36).slice(2);
    const time = Date.now().toString(36);
    return `run-${time}-${random}`;
  }
  