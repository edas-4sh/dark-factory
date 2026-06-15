import { LLMClient } from '@dark-factory/llm-client';

export class DoctorMode {
  private llm: LLMClient;

  constructor(llm: LLMClient) {
    this.llm = llm;
  }

  async execute(args: Record<string, unknown>, task: Record<string, unknown>): Promise<void> {
    const targetAgentId = args.targetAgentId as string;
    const diagnosis = args.diagnosis as string;

    console.log(`[Doctor] Checking health of ${targetAgentId}: ${diagnosis}`);
  }
}
