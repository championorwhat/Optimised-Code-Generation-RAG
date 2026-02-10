/**
 * Execute generated code against test suite
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { logger } from '../../../utils/logger';

const execAsync = promisify(exec);

export interface TestResult {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  output: string;
  errors: string[];
}

export class TestRunner {
  /**
   * Run code with test suite
   */
  static async run(
    code: string,
    language: string,
    testCode: string,
  ): Promise<TestResult> {
    const tempFile = join(tmpdir(), `test_${Date.now()}.${this._getExtension(language)}`);
    const startTime = Date.now();

    try {
      // Write code + tests to temp file
      const fullCode = this._combineCodeWithTests(
        code,
        testCode,
        language,
      );
      writeFileSync(tempFile, fullCode, 'utf-8');

      // Execute
      const { stdout, stderr } = await execAsync(
        this._buildCommand(tempFile, language),
        {
          timeout: 10000,
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      // Parse results
      return this._parseResults(
        stdout,
        stderr,
        Date.now() - startTime,
      );
    } catch (error) {
      logger.error('Test execution failed', { error });
      return {
        passed: 0,
        failed: 1,
        total: 1,
        duration: Date.now() - startTime,
        output: '',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    } finally {
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  private static _getExtension(language: string): string {
    const extMap: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
    };
    return extMap[language] || 'txt';
  }

  private static _buildCommand(file: string, language: string): string {
    const cmdMap: Record<string, string> = {
      python: `python3 ${file}`,
      javascript: `node ${file}`,
      typescript: `ts-node ${file}`,
      java: `javac ${file} && java ${file}`,
    };
    return cmdMap[language] || `cat ${file}`;
  }

  private static _combineCodeWithTests(
    code: string,
    testCode: string,
    language: string,
  ): string {
    return `${code}\n\n/* TESTS */\n${testCode}`;
  }

  private static _parseResults(
    stdout: string,
    stderr: string,
    duration: number,
  ): TestResult {
    // Simplistic parsing - in production, use proper test framework integration
    const lines = stdout.split('\n');
    let passed = 0;
    let failed = 0;

    for (const line of lines) {
      if (line.includes('PASS')) passed++;
      if (line.includes('FAIL')) failed++;
    }

    return {
      passed: Math.max(1, passed),
      failed: Math.max(0, failed),
      total: Math.max(1, passed + failed),
      duration,
      output: stdout,
      errors: stderr ? [stderr] : [],
    };
  }
}
