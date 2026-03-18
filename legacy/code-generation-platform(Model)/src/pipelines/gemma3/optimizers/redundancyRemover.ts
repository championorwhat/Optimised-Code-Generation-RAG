/**
 * Remove redundant and duplicate logic
 */

export class RedundancyRemover {
    /**
     * Detect and suggest removal of duplicate code
     */
    static detectDuplicates(code: string): DuplicateReport {
      const lines = code.split('\n');
      const lineMap = new Map<string, number[]>();
      const duplicates: string[] = [];
  
      // Find identical lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 10) {
          // Ignore short lines
          if (!lineMap.has(line)) {
            lineMap.set(line, []);
          }
          lineMap.get(line)!.push(i);
        }
      }
  
      // Collect duplicates
      for (const [line, indices] of lineMap) {
        if (indices.length > 1) {
          duplicates.push(
            `Line appears ${indices.length} times: ${line.substring(0, 50)}...`,
          );
        }
      }
  
      return {
        duplicateCount: duplicates.length,
        details: duplicates,
      };
    }
  }
  
  export interface DuplicateReport {
    duplicateCount: number;
    details: string[];
  }
  