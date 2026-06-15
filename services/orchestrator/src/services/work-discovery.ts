import { DB } from '@dark-factory/db';
import { GitHubClient } from '@dark-factory/github-client';
import { TaskQueue } from './task-queue';

export class WorkDiscovery {
  private db: DB;
  private github: GitHubClient;
  private taskQueue: TaskQueue;
  private seenIssueNumbers: Set<number> = new Set();

  constructor(db: DB, github: GitHubClient, taskQueue: TaskQueue) {
    this.db = db;
    this.github = github;
    this.taskQueue = taskQueue;
  }

  async poll(): Promise<void> {
    try {
      console.log('[WorkDiscovery] Checking for new GitHub issues...');
      const issues = await this.github.listOpenIssues();

      for (const issue of issues) {
        if (this.seenIssueNumbers.has(issue.number)) continue;
        this.seenIssueNumbers.add(issue.number);

        const priority = this.inferPriority(issue.title, issue.body);
        this.taskQueue.createTask({
          title: issue.title,
          description: issue.body,
          priority,
          source: 'github_issue',
          sourceUrl: issue.url,
        });

        await this.github.addIssueComment(
          issue.number,
          `👋 Dark Factory agent **Alpha** has registered this as task \`${issue.title}\`. An agent will pick it up shortly.`
        );
      }
      console.log(`[WorkDiscovery] Found ${issues.length} open issues`);
    } catch (err) {
      console.error('[WorkDiscovery] Error polling GitHub:', err);
    }
  }

  private inferPriority(title: string, body: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = `${title} ${body}`.toLowerCase();
    if (text.includes('critical') || text.includes('security') || text.includes('crash') || text.includes('urgent')) return 'critical';
    if (text.includes('bug') || text.includes('error') || text.includes('fail') || text.includes('broken')) return 'high';
    if (text.includes('feature') || text.includes('enhancement') || text.includes('improve')) return 'medium';
    return 'low';
  }

  manualDiscover(): void {
    this.poll().catch(console.error);
  }
}
