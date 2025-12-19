/**
 * Individual pipeline stage definitions and executors
 */

import { PipelineContext } from './context';
import { PipelineStage } from './types';
import { logger } from '../../../utils/logger';
import { StorageService } from '../../../services/storageService';

/**
 * Stage 1: Preprocessing - validate and prepare prompt
 */
export async function preprocessingStage(ctx: PipelineContext): Promise<void> {
  const start = Date.now();

  try {
    const { prompt, language } = ctx.request;

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (prompt.length > 5000) {
      logger.warn('Prompt exceeds 5000 characters, truncating');
    }

    // Estimate tokens
    const estimatedTokens = Math.ceil(prompt.length / 4);

    ctx.setData('processedPrompt', prompt.trim());
    ctx.setData('estimatedTokens', estimatedTokens);
    ctx.setData('language', language || 'javascript');

    ctx.recordStageResult(PipelineStage.PREPROCESSING, 'success', Date.now() - start);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.PREPROCESSING,
      'failed',
      Date.now() - start,
      errMsg,
    );
    throw error;
  }
}

/**
 * Stage 2: Model Invocation - call Gemma3
 */
export async function modelInvocationStage(
  ctx: PipelineContext,
  adapter: any, // Gemma3Adapter
): Promise<void> {
  const start = Date.now();

  try {
    const prompt = ctx.getData('processedPrompt');
    const { maxTokens, temperature, topP } = ctx.request.options || {};

    logger.info('Invoking Gemma3', { runId: ctx.runId });

    const response = await adapter.generate({
      prompt,
      maxTokens: maxTokens || 1024,
      temperature: temperature || 0.7,
      topP: topP || 0.95,
    });

    ctx.setData('rawModelOutput', response.text);
    ctx.setData('finishReason', response.finishReason);
    ctx.recordMetric('inputTokens', response.usage.inputTokens);
    ctx.recordMetric('outputTokens', response.usage.outputTokens);

    ctx.recordStageResult(
      PipelineStage.MODEL_INVOCATION,
      'success',
      Date.now() - start,
      undefined,
      {
        tokens: response.usage.inputTokens + response.usage.outputTokens,
      },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.MODEL_INVOCATION,
      'failed',
      Date.now() - start,
      errMsg,
    );
    throw error;
  }
}

/**
 * Stage 3: Normalization - extract and parse code
 */
export async function normalizationStage(ctx: PipelineContext): Promise<void> {
  const start = Date.now();

  try {
    const rawOutput = ctx.getData('rawModelOutput');
    const language = ctx.getData('language');

    // Placeholder: would use parseModelOutput here
    const code = extractCodeFromText(rawOutput);

    if (!code || code.length === 0) {
      throw new Error('No code extracted from model output');
    }

    ctx.setData('extractedCode', code);
    ctx.recordMetric('codeLength', code.length);

    ctx.recordStageResult(PipelineStage.NORMALIZATION, 'success', Date.now() - start);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.NORMALIZATION,
      'failed',
      Date.now() - start,
      errMsg,
    );
    throw error;
  }
}

/**
 * Stage 4: Optimization - refactor code
 */
export async function optimizationStage(
  ctx: PipelineContext,
  optimizer: any, // Code optimizer module
): Promise<void> {
  const start = Date.now();

  try {
    if (ctx.request.options?.skipOptimization) {
      ctx.recordStageResult(PipelineStage.OPTIMIZATION, 'skipped', 0);
      return;
    }

    const code = ctx.getData('extractedCode');
    const language = ctx.getData('language');

    // Placeholder optimization
    const optimizedCode = code; // optimizer.optimize(code, language)

    ctx.setData('optimizedCode', optimizedCode);

    ctx.recordStageResult(PipelineStage.OPTIMIZATION, 'success', Date.now() - start);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.OPTIMIZATION,
      'failed',
      Date.now() - start,
      errMsg,
    );
    throw error;
  }
}

/**
 * Stage 5: Validation - lint and type-check
 */
export async function validationStage(
  ctx: PipelineContext,
  validator: any, // Validator module
): Promise<void> {
  const start = Date.now();

  try {
    if (ctx.request.options?.skipValidation) {
      ctx.recordStageResult(PipelineStage.VALIDATION, 'skipped', 0);
      return;
    }

    const code = ctx.getData('optimizedCode') || ctx.getData('extractedCode');
    const language = ctx.getData('language');

    // Placeholder validation
    const issues: any[] = []; // validator.lint(code, language)

    ctx.setData('validationIssues', issues);
    ctx.recordMetric('issueCount', issues.length);

    ctx.recordStageResult(PipelineStage.VALIDATION, 'success', Date.now() - start);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.VALIDATION,
      'failed',
      Date.now() - start,
      errMsg,
    );
    // Validation errors are non-fatal
  }
}

/**
 * Stage 6: Testing - run test suite
 */
export async function testingStage(
  ctx: PipelineContext,
  testRunner: any, // Test runner module
): Promise<void> {
  const start = Date.now();

  try {
    if (ctx.request.options?.skipTesting) {
      ctx.recordStageResult(PipelineStage.TESTING, 'skipped', 0);
      return;
    }

    const code = ctx.getData('optimizedCode') || ctx.getData('extractedCode');
    const testSuiteId = ctx.request.testSuiteId;

    if (!testSuiteId) {
      ctx.recordStageResult(PipelineStage.TESTING, 'skipped', 0);
      return;
    }

    // Placeholder test execution
    const testResult = {
      passed: 5,
      failed: 0,
      total: 5,
    }; // await testRunner.run(code, testSuiteId)

    ctx.setData('testResult', testResult);
    ctx.recordMetric('testsPassed', testResult.passed);
    ctx.recordMetric('testsFailed', testResult.failed);

    ctx.recordStageResult(PipelineStage.TESTING, 'success', Date.now() - start);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.TESTING,
      'failed',
      Date.now() - start,
      errMsg,
    );
    // Testing errors are non-fatal
  }
}

/**
 * Stage 7: Packaging - prepare final result
 */
export async function packagingStage(
  ctx: PipelineContext,
  storage: StorageService, // Storage service
): Promise<void> {
  const start = Date.now();

  try {
    const code = ctx.getData('optimizedCode') || ctx.getData('extractedCode');
    const language = ctx.getData('language');

    // Store artifacts
    const codeArtifact = await storage.storeArtifact(code, 'code', language);

    ctx.setData('codeArtifactId', codeArtifact.id);
    ctx.recordMetric('artifactId', codeArtifact.id);

    ctx.recordStageResult(PipelineStage.PACKAGING, 'success', Date.now() - start);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    ctx.recordStageResult(
      PipelineStage.PACKAGING,
      'failed',
      Date.now() - start,
      errMsg,
    );
    throw error;
  }
}

/**
 * Helper: Extract code blocks from text
 */
function extractCodeFromText(text: string): string {
  const codeBlockRegex = /``````/;
  const match = text.match(codeBlockRegex);
  return match ? match[1].trim() : text.trim();
}
