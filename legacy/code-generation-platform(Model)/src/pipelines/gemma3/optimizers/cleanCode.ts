/**
 * Code formatting and cleanup optimizer
 */

export class CodeCleaner {
    /**
     * Format code using language-specific rules
     */
    static format(code: string, language: string): string {
      switch (language) {
        case 'python':
          return this._formatPython(code);
        case 'javascript':
        case 'typescript':
          return this._formatJavaScript(code);
        case 'java':
          return this._formatJava(code);
        default:
          return this._formatGeneric(code);
      }
    }
  
    private static _formatPython(code: string): string {
      let formatted = code;
  
      // Remove trailing whitespace
      formatted = formatted
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');
  
      // Ensure proper spacing around operators
      formatted = formatted
        .replace(/(\S)\s*([+\-*/=<>])\s*(\S)/g, '$1 $2 $3');
  
      // Add blank line between functions
      formatted = formatted.replace(
        /\n(def\s+\w+|class\s+\w+)/g,
        '\n\n$1',
      );
  
      return formatted;
    }
  
    private static _formatJavaScript(code: string): string {
      let formatted = code;
  
      // Remove trailing whitespace
      formatted = formatted
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');
  
      // Ensure blank lines between functions
      formatted = formatted.replace(
        /\n(function|const|class|async)\s+/g,
        '\n\n$1 ',
      );
  
      return formatted;
    }
  
    private static _formatJava(code: string): string {
      // Similar to JavaScript
      return this._formatJavaScript(code);
    }
  
    private static _formatGeneric(code: string): string {
      return code
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');
    }
  }
  