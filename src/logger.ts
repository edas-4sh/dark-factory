// Simple Logger utility
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LoggerConfig {
  /** Minimum level to output */
  level?: LogLevel;
  /** Optional custom output function, defaults to console */
  output?: (level: LogLevel, message: string) => void;
}

export class Logger {
  private level: LogLevel;
  private output: (level: LogLevel, message: string) => void;

  private static levelOrder: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(config: LoggerConfig = {}) {
    this.level = config.level ?? LogLevel.DEBUG;
    this.output = config.output ?? ((lvl, msg) => console.log(`[${lvl}] ${msg}`));
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levelOrder[level] >= Logger.levelOrder[this.level];
  }

  private log(level: LogLevel, message: string): void {
    if (this.shouldLog(level)) {
      this.output(level, message);
    }
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }
}
