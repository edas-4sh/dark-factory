export const AGENT_NAMES: Record<string, string> = {
  'agent-alpha': 'Alpha',
  'agent-beta': 'Beta',
  'agent-gamma': 'Gamma',
  'agent-delta': 'Delta',
  'agent-epsilon': 'Epsilon',
};

export const AGENT_ROLES: Record<string, string> = {
  'agent-alpha': 'Architect',
  'agent-beta': 'Builder',
  'agent-gamma': 'Reviewer',
  'agent-delta': 'DevOps',
  'agent-epsilon': 'Doctor',
};

export const DEFAULT_LLM_MODEL = 'mistralai/mixtral-8x7b-instruct';
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TEMPERATURE = 0.7;
