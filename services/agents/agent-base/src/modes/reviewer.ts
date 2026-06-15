import { LLMClient } from '@dark-factory/llm-client';
import { GitHubClient } from '@dark-factory/github-client';

export class ReviewerMode {
  private llm: LLMClient;
  private github: GitHubClient;

  constructor(llm: LLMClient, github: GitHubClient) {
    this.llm = llm;
    this.github = github;
  }

  async execute(args: Record<string, unknown>, task: Record<string, unknown>): Promise<void> {
    const prNumber = args.prNumber as number;
    const verdict = args.verdict as 'approve' | 'request_changes' | 'reject';
    const comments = args.comments as string;

    const mappedVerdict = verdict === 'reject' ? 'request_changes' : verdict;
    await this.github.reviewPullRequest(prNumber, mappedVerdict as 'approve' | 'request_changes', comments);
    console.log(`[Reviewer] Reviewed PR #${prNumber}: ${verdict}`);
  }
}
