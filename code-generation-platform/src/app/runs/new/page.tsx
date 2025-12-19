/* app/runs/new/page.tsx */

'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { runsAPI } from '@/services/runs';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'cpp',
];

const MODELS = [
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    costPerToken: 0.00003,
  },
  {
    id: 'claude-3.5',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    costPerToken: 0.00008,
  },
  {
    id: 'gemini-2.0',
    name: 'Gemini 2.0',
    provider: 'Google',
    costPerToken: 0.000075,
  },
  {
    id: 'llama-3.1',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    costPerToken: 0.00004,
  },
];

export default function NewRunPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [timeout, setTimeout] = useState(30);
  const [parallelMode, setParallelMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedCost =
    selectedModels.reduce((sum, modelId) => {
      const model = MODELS.find((m) => m.id === modelId);
      return sum + (model?.costPerToken || 0) * 1000; // Rough estimate
    }, 0) * 10; // Assume ~10k tokens per run

  const handleToggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((m) => m !== modelId)
        : [...prev, modelId]
    );
  };

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await runsAPI.create({
        prompt,
        language,
        selectedModels,
        timeout,
        parallelMode,
      });

      // Redirect to run details
      router.push(`/runs/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar title="New Code Generation Run" />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {error && (
              <Alert
                variant="error"
                title="Error"
                message={error}
                dismissible
                onDismiss={() => setError(null)}
                className="mb-6"
              />
            )}

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Prompt Editor */}
              <div>
                <Card
                  title="Code Prompt"
                  subtitle="Enter your requirements or code snippet"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="input-base w-full"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Your Prompt
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you want the code to do..."
                        className="input-base w-full h-64 resize-none"
                      />
                    </div>

                    <div className="text-xs text-neutral-500">
                      {prompt.length} characters
                    </div>
                  </div>
                </Card>
              </div>

              {/* Center Panel - Model Selection */}
              <div>
                <Card
                  title="Select Models"
                  subtitle="Choose AI models to generate code"
                >
                  <div className="space-y-3">
                    {MODELS.map((model) => (
                      <label
                        key={model.id}
                        className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => handleToggleModel(model.id)}
                          className="w-4 h-4 accent-blue-500 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {model.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {model.provider} •${model.costPerToken.toFixed(6)}/token
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedModels.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <p className="text-xs text-neutral-400 mb-2">
                        Selected: {selectedModels.length} model
                        {selectedModels.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedModels.map((modelId) => {
                          const model = MODELS.find((m) => m.id === modelId);
                          return (
                            model && (
                              <Badge
                                key={modelId}
                                label={model.name}
                                variant="primary"
                                size="sm"
                                dismissible
                                onDismiss={() => handleToggleModel(modelId)}
                              />
                            )
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Panel - Test Configuration */}
              <div>
                <Card
                  title="Run Settings"
                  subtitle="Configure execution parameters"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Timeout (seconds)
                      </label>
                      <Input
                        type="number"
                        value={timeout}
                        onChange={(e) => setTimeout(parseInt(e.target.value))}
                        min={10}
                        max={300}
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Maximum time to wait for results
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                      <input
                        type="checkbox"
                        checked={parallelMode}
                        onChange={(e) => setParallelMode(e.target.checked)}
                        className="w-4 h-4 accent-blue-500 rounded"
                        id="parallel-mode"
                      />
                      <label
                        htmlFor="parallel-mode"
                        className="flex-1 cursor-pointer"
                      >
                        <p className="text-sm font-medium text-white">
                          Parallel Mode
                        </p>
                        <p className="text-xs text-neutral-400">
                          Run all models simultaneously
                        </p>
                      </label>
                    </div>

                    {/* Cost Estimate */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300 mb-2">
                        Estimated Cost
                      </p>
                      <p className="text-2xl font-bold text-white">
                        ${estimatedCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-300 mt-1">
                        Based on model selection
                      </p>
                    </div>

                    {/* Run Button */}
                    <Button
                      onClick={handleRunAnalysis}
                      isLoading={isLoading}
                      loadingText="Starting..."
                      fullWidth
                      size="lg"
                      icon={<ChevronRight size={18} />}
                      iconPosition="right"
                    >
                      Run Analysis
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
