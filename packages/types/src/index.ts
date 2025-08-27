// Created automatically by Cursor AI (2025-08-27)

export type LanguageCode = string; // ISO 639-1

export type ToolInvocation = {
  toolName: string;
  input: unknown;
  startedAt: string;
  finishedAt?: string;
  success?: boolean;
  errorMessage?: string;
};

export type Citation = {
  documentId: string;
  chunkId?: string;
  url?: string;
  anchorText?: string;
  confidence?: number; // 0..1
};

export type MessageRecord = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  toolCalls?: ToolInvocation[];
  toolResults?: ToolInvocation[];
  costUsd?: number;
  latencyMs?: number;
  createdAt: string;
};

export type FlowStep =
  | { type: 'Ask'; promptTemplateId: string }
  | { type: 'Retrieve'; collectionIds: string[]; topK: number }
  | { type: 'Tool'; toolName: string; inputSchema: unknown }
  | { type: 'Escalate'; channel: 'zendesk' | 'intercom' | 'jira' | 'email' };

export type FlowDefinition = {
  id: string;
  name: string;
  steps: FlowStep[];
};

export type PolicyConfig = {
  jailbreakDetection: boolean;
  piiFilter: boolean;
  profanityFilter: boolean;
  selfHarmRouting: boolean;
  style: 'formal' | 'concise' | 'friendly';
  forbiddenClaims: string[];
};

export type PromptVariant = {
  channel: 'web' | 'slack' | 'teams' | 'intercom' | 'zendesk' | 'sms' | 'email' | 'voice';
  template: string;
};

export type AgentConfig = {
  flow: FlowDefinition;
  policies: PolicyConfig;
  prompts: PromptVariant[];
  tools: string[];
};
