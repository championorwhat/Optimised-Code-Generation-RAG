import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface StoredArtifact {
  id: string;
  path: string;
  type: 'code' | 'test_result' | 'analysis';
  language: string;
}

export class StorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.env.ARTIFACT_STORAGE_PATH || 'artifacts';
    mkdirSync(this.baseDir, { recursive: true });
  }

  async storeArtifact(
    content: string,
    type: 'code' | 'test_result' | 'analysis',
    language: string,
  ): Promise<StoredArtifact> {
    const id = `artifact-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const fileName = `${id}.${type === 'code' ? (language || 'txt') : 'json'}`;
    const fullPath = join(this.baseDir, fileName);

    writeFileSync(fullPath, content, 'utf-8');

    return {
      id,
      path: fullPath,
      type,
      language,
    };
  }
}
