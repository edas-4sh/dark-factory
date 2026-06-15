import { Octokit } from 'octokit';
import { GitHubConfig } from '@dark-factory/shared';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: Partial<GitHubConfig> = {}) {
    const token = config.token || process.env.GITHUB_TOKEN || '';
    this.owner = config.owner || process.env.GITHUB_OWNER || '';
    this.repo = config.repo || process.env.GITHUB_REPO || '';
    this.octokit = new Octokit({ auth: token });
  }

  async listOpenIssues(): Promise<Array<{ number: number; title: string; body: string; url: string }>> {
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: 'open',
      sort: 'created',
      direction: 'desc',
    });
    return data.map((issue: { number: number; title: string; body: string | null; html_url: string }) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      url: issue.html_url,
    }));
  }

  async createBranch(baseBranch: string, newBranch: string): Promise<void> {
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${baseBranch}`,
    });
    await this.octokit.rest.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${newBranch}`,
      sha: ref.object.sha,
    });
  }

  async commitFile(
    branch: string,
    path: string,
    content: string,
    message: string,
  ): Promise<void> {
    const { data: repo } = await this.octokit.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
      ref: branch,
    }).catch(() => ({ data: null }));

    if (repo && 'sha' in repo) {
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha: repo.sha as string,
        branch,
      });
    } else {
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
      });
    }
  }

  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string = 'main',
  ): Promise<{ number: number; url: string }> {
    const { data } = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      head,
      base,
    });
    return { number: data.number, url: data.html_url };
  }

  async reviewPullRequest(
    prNumber: number,
    action: 'approve' | 'request_changes' | 'comment',
    body: string,
  ): Promise<void> {
    const event = action === 'approve' ? 'APPROVE'
      : action === 'request_changes' ? 'REQUEST_CHANGES'
      : 'COMMENT';
    await this.octokit.rest.pulls.createReview({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      event,
      body,
    });
  }

  async addIssueComment(issueNumber: number, body: string): Promise<void> {
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body,
    });
  }

  async getFileContents(path: string, ref?: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref,
      });
      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }
}
