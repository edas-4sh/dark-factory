import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

export class DB {
  private db: SqlJsDatabase;
  private dbPath: string;

  private constructor(db: SqlJsDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  static async create(dbPath?: string): Promise<DB> {
    const resolvedPath = dbPath || process.env.DATABASE_PATH || './data/dark-factory.db';
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const SQL = await initSqlJs();
    let db: SqlJsDatabase;

    if (fs.existsSync(resolvedPath)) {
      const buffer = fs.readFileSync(resolvedPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    const instance = new DB(db, resolvedPath);
    instance.migrate();
    instance.save();
    return instance;
  }

  private save(): void {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'offline',
        last_heartbeat INTEGER NOT NULL DEFAULT 0,
        health_score REAL NOT NULL DEFAULT 100,
        tasks_completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as int))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'queued',
        source TEXT NOT NULL DEFAULT 'manual',
        source_url TEXT,
        assigned_agent_id TEXT,
        created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as int)),
        updated_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id TEXT NOT NULL,
        depends_on_id TEXT NOT NULL,
        PRIMARY KEY (task_id, depends_on_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (depends_on_id) REFERENCES tasks(id)
      );

      CREATE TABLE IF NOT EXISTS work_items (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        input TEXT NOT NULL DEFAULT '',
        output TEXT,
        created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as int)),
        completed_at INTEGER,
        error TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        work_item_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        verdict TEXT NOT NULL,
        comments TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (work_item_id) REFERENCES work_items(id),
        FOREIGN KEY (reviewer_id) REFERENCES agents(id)
      );

      CREATE TABLE IF NOT EXISTS health_checks (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        checked_by TEXT NOT NULL,
        timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as int)),
        response_time REAL NOT NULL DEFAULT 0,
        error_rate REAL NOT NULL DEFAULT 0,
        uptime REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'healthy',
        details TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (agent_id) REFERENCES agents(id),
        FOREIGN KEY (checked_by) REFERENCES agents(id)
      );
    `);
  }

  private queryAll(sql: string, params?: Record<string, unknown>): Array<Record<string, unknown>> {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params);
    const results: Array<Record<string, unknown>> = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, unknown>;
      results.push(row);
    }
    stmt.free();
    return results;
  }

  private queryOne(sql: string, params?: Record<string, unknown>): Record<string, unknown> | undefined {
    const results = this.queryAll(sql, params);
    return results.length > 0 ? results[0] : undefined;
  }

  private run(sql: string, params?: Record<string, unknown>): void {
    if (params) {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
    } else {
      this.db.run(sql);
    }
    this.save();
  }

  // Agent operations
  upsertAgent(agent: { id: string; name: string; role: string }): void {
    const existing = this.queryOne('SELECT id FROM agents WHERE id = $id', { $id: agent.id });
    if (existing) {
      this.run('UPDATE agents SET name = $name, role = $role WHERE id = $id', {
        $name: agent.name, $role: agent.role, $id: agent.id,
      });
    } else {
      this.run('INSERT INTO agents (id, name, role) VALUES ($id, $name, $role)', {
        $id: agent.id, $name: agent.name, $role: agent.role,
      });
    }
  }

  updateAgentStatus(id: string, status: string, healthScore?: number): void {
    if (healthScore !== undefined) {
      this.run('UPDATE agents SET status = $status, health_score = $score, last_heartbeat = cast(strftime(\'%s\',\'now\') as int) WHERE id = $id', {
        $status: status, $score: healthScore, $id: id,
      });
    } else {
      this.run('UPDATE agents SET status = $status, last_heartbeat = cast(strftime(\'%s\',\'now\') as int) WHERE id = $id', {
        $status: status, $id: id,
      });
    }
  }

  incrementAgentTasksCompleted(id: string): void {
    this.run('UPDATE agents SET tasks_completed = tasks_completed + 1 WHERE id = $id', { $id: id });
  }

  getAgent(id: string): Record<string, unknown> | undefined {
    return this.queryOne('SELECT * FROM agents WHERE id = $id', { $id: id });
  }

  getAllAgents(): Array<Record<string, unknown>> {
    return this.queryAll('SELECT * FROM agents ORDER BY name');
  }

  // Task operations
  createTask(task: { id: string; title: string; description?: string; priority?: string; source?: string; sourceUrl?: string }): void {
    this.run(
      'INSERT INTO tasks (id, title, description, priority, source, source_url) VALUES ($id, $title, $desc, $priority, $source, $sourceUrl)',
      {
        $id: task.id,
        $title: task.title,
        $desc: task.description || '',
        $priority: task.priority || 'medium',
        $source: task.source || 'manual',
        $sourceUrl: task.sourceUrl || null,
      },
    );
  }

  updateTaskStatus(id: string, status: string, agentId?: string): void {
    if (agentId) {
      this.run('UPDATE tasks SET status = $status, assigned_agent_id = $agentId, updated_at = cast(strftime(\'%s\',\'now\') as int) WHERE id = $id', {
        $status: status, $agentId: agentId, $id: id,
      });
    } else {
      this.run('UPDATE tasks SET status = $status, updated_at = cast(strftime(\'%s\',\'now\') as int) WHERE id = $id', {
        $status: status, $id: id,
      });
    }
  }

  getTask(id: string): Record<string, unknown> | undefined {
    return this.queryOne('SELECT * FROM tasks WHERE id = $id', { $id: id });
  }

  getQueuedTasks(limit: number = 10): Array<Record<string, unknown>> {
    return this.queryAll(
      `SELECT * FROM tasks WHERE status = 'queued' ORDER BY
       CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       created_at ASC LIMIT $limit`,
      { $limit: limit },
    );
  }

  getAllTasks(): Array<Record<string, unknown>> {
    return this.queryAll('SELECT * FROM tasks ORDER BY created_at DESC');
  }

  // Work item operations
  createWorkItem(item: { id: string; taskId: string; agentId: string; mode: string; input: string }): void {
    this.run(
      'INSERT INTO work_items (id, task_id, agent_id, mode, input) VALUES ($id, $taskId, $agentId, $mode, $input)',
      {
        $id: item.id,
        $taskId: item.taskId,
        $agentId: item.agentId,
        $mode: item.mode,
        $input: item.input,
      },
    );
  }

  updateWorkItemStatus(id: string, status: string, output?: string, error?: string): void {
    const completedAt = status === 'completed' || status === 'failed' ? Date.now() : undefined;
    if (completedAt) {
      this.run('UPDATE work_items SET status = $status, output = $output, error = $error, completed_at = $completedAt WHERE id = $id', {
        $status: status,
        $output: output || null,
        $error: error || null,
        $completedAt: completedAt,
        $id: id,
      });
    } else {
      this.run('UPDATE work_items SET status = $status WHERE id = $id', { $status: status, $id: id });
    }
  }

  getWorkItemsByTask(taskId: string): Array<Record<string, unknown>> {
    return this.queryAll('SELECT * FROM work_items WHERE task_id = $taskId ORDER BY created_at ASC', { $taskId: taskId });
  }

  // Review operations
  createReview(review: { id: string; workItemId: string; reviewerId: string; verdict: string; comments: string }): void {
    this.run(
      'INSERT INTO reviews (id, work_item_id, reviewer_id, verdict, comments) VALUES ($id, $workItemId, $reviewerId, $verdict, $comments)',
      {
        $id: review.id,
        $workItemId: review.workItemId,
        $reviewerId: review.reviewerId,
        $verdict: review.verdict,
        $comments: review.comments,
      },
    );
  }

  getReviewsByWorkItem(workItemId: string): Array<Record<string, unknown>> {
    return this.queryAll('SELECT * FROM reviews WHERE work_item_id = $workItemId ORDER BY created_at DESC', { $workItemId: workItemId });
  }

  // Health check operations
  insertHealthCheck(check: { id: string; agentId: string; checkedBy: string; responseTime: number; errorRate: number; uptime: number; status: string; details: Record<string, unknown> }): void {
    this.run(
      'INSERT INTO health_checks (id, agent_id, checked_by, response_time, error_rate, uptime, status, details) VALUES ($id, $agentId, $checkedBy, $responseTime, $errorRate, $uptime, $status, $details)',
      {
        $id: check.id,
        $agentId: check.agentId,
        $checkedBy: check.checkedBy,
        $responseTime: check.responseTime,
        $errorRate: check.errorRate,
        $uptime: check.uptime,
        $status: check.status,
        $details: JSON.stringify(check.details),
      },
    );
  }

  getLatestHealthChecks(limit: number = 50): Array<Record<string, unknown>> {
    return this.queryAll('SELECT * FROM health_checks ORDER BY timestamp DESC LIMIT $limit', { $limit: limit });
  }

  // Dashboard aggregation
  getDashboardStats(): Record<string, unknown> {
    const totalAgents = this.queryOne("SELECT COUNT(*) as count FROM agents")?.count || 0;
    const agentsOnline = this.queryOne("SELECT COUNT(*) as count FROM agents WHERE status = 'idle' OR status = 'busy'")?.count || 0;
    const queuedTasks = this.queryOne("SELECT COUNT(*) as count FROM tasks WHERE status = 'queued'")?.count || 0;
    const completedToday = this.queryOne("SELECT COUNT(*) as count FROM work_items WHERE status = 'completed' AND created_at >= (cast(strftime('%s','now') as int) - 86400)")?.count || 0;
    return { totalAgents, agentsOnline, queuedTasks, completedToday };
  }

  close(): void {
    this.save();
    this.db.close();
  }
}
