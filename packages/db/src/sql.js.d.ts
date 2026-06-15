declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: Record<string, unknown>): Database;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface Statement {
    bind(params?: Record<string, unknown>): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): boolean;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>;
  export default initSqlJs;
  export { Database, SqlJsStatic };
}
