import { LLMClient } from '@dark-factory/llm-client';
import { GitHubClient } from '@dark-factory/github-client';

export class CoderMode {
  private llm: LLMClient;
  private github: GitHubClient;

  constructor(llm: LLMClient, github: GitHubClient) {
    this.llm = llm;
    this.github = github;
  }

  async execute(args: Record<string, unknown>, task: Record<string, unknown>): Promise<void> {
    const branchName = args.branchName as string || `auto/${task.id}-${Date.now()}`;
    const files = args.files as Array<{ path: string; content: string; commitMessage: string }> || [];
    const prTitle = args.prTitle as string || `feat: ${task.title}`;
    const prBody = args.prBody as string || `Automated implementation for: ${task.title}`;

    await this.github.createBranch('main', branchName);

    for (const file of files) {
      await this.github.commitFile(branchName, file.path, file.content, file.commitMessage);
    }

    const { number, url } = await this.github.createPullRequest(prTitle, prBody, branchName);

    console.log(`[Coder] Created PR #${number}: ${url}`);
  }
}
