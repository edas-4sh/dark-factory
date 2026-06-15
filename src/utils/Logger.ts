class Logger {
  private level: string = 'info';
  private output: (message: string) => void;

  constructor(output = console.log) {
    this.output = output;
  }

  setLevel(level: string) {
    this.level = level;
  }

  log(message: string) {
    if (this.level <= 'log') this.output(`[LOG] ${message}`);
  }

  // Similar methods for error/warn/info
}