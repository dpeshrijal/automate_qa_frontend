/**
 * Frontend type definitions
 * Mirrors backend types for type safety
 */

export interface TestDefinition {
  id: string;
  name: string;
  url: string;
  instructions: string;
  desiredOutcome: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: "COMPLETED" | "FAILED" | "RUNNING";
  lastRunScreenshot?: string;
}

export interface TestRun {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  url: string;
  outcome?: string;
  result?: string;
  screenshot?: string;
  history?: TestExecutionStep[];
  testDefinitionId?: string;
  createdAt: string;
  updatedAt?: string;
  error?: string;
}

export interface TestExecutionStep {
  action: string;
  target?: string;
  value?: string;
  success: boolean;
  timestamp: string;
}
