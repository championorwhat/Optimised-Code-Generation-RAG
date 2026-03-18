/**
 * Parse Gemma3 model output and extract code blocks
 */

interface CodeBlock {
    language: string;
    code: string;
    startLine: number;
    endLine: number;
  }
  
  interface ParsedOutput {
    fullText: string;
    codeBlocks: CodeBlock[];
    hasCode: boolean;
    mainLanguage: string;
  }
  
  /**
   * Parse model output to extract code blocks
   */
  export function parseModelOutput(text: string): ParsedOutput {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /``````/g;
  
    let match;
    let lineNum = 1;
  
    // Extract markdown code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      const startLine = lineNum;
      const endLine = lineNum + code.split('\n').length - 1;
  
      codeBlocks.push({
        language: normalizeLanguage(language),
        code,
        startLine,
        endLine,
      });
  
      lineNum = endLine + 1;
    }
  
    // Determine primary language from all blocks
    const mainLanguage = determineMainLanguage(codeBlocks);
  
    return {
      fullText: text,
      codeBlocks,
      hasCode: codeBlocks.length > 0,
      mainLanguage,
    };
  }
  
  /**
   * Normalize language names to standard identifiers
   */
  function normalizeLanguage(lang: string): string {
    const normalizationMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      bash: 'bash',
      sh: 'bash',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rust',
      sql: 'sql',
    };
  
    return normalizationMap[lang.toLowerCase()] || lang.toLowerCase();
  }
  
  /**
   * Determine primary language based on code blocks
   */
  function determineMainLanguage(blocks: CodeBlock[]): string {
    if (blocks.length === 0) return 'unknown';
  
    const languageFreq = new Map<string, number>();
  
    for (const block of blocks) {
      languageFreq.set(block.language, (languageFreq.get(block.language) || 0) + 1);
    }
  
    let maxLang = blocks[0].language;
    let maxCount = 1;
  
    for (const [lang, count] of languageFreq) {
      if (count > maxCount) {
        maxLang = lang;
        maxCount = count;
      }
    }
  
    return maxLang;
  }
  