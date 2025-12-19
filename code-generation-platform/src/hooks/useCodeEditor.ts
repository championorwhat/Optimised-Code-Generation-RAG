/* src/hooks/useCodeEditor.ts */

import { useState, useCallback } from 'react';

export interface UseCodeEditorOptions {
  initialValue?: string;
  language?: string;
}

export function useCodeEditor({
  initialValue = '',
  language = 'javascript',
}: UseCodeEditorOptions = {}) {
  const [code, setCode] = useState(initialValue);
  const [language_, setLanguage] = useState(language);
  const [hasChanges, setHasChanges] = useState(false);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    setHasChanges(true);
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage_(lang);
  }, []);

  const reset = useCallback(() => {
    setCode(initialValue);
    setHasChanges(false);
  }, [initialValue]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code);
    return true;
  }, [code]);

  const download = useCallback((filename?: string) => {
    const ext = getFileExtension(language_);
    const name = filename || `code.${ext}`;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(code)
    );
    element.setAttribute('download', name);
    element.style.display = 'none';

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [code, language_]);

  return {
    code,
    setCode: handleCodeChange,
    language: language_,
    setLanguage: handleLanguageChange,
    hasChanges,
    reset,
    copy,
    download,
  };
}

function getFileExtension(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    go: 'go',
    rust: 'rs',
    cpp: 'cpp',
    csharp: 'cs',
  };
  return map[lang] || 'txt';
}
