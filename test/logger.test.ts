import { Logger, LogLevel } from '../src/logger';

describe('Logger', () => {
  it('should respect log level filtering', () => {
    const outputs: string[] = [];
    const logger = new Logger({
      level: LogLevel.WARN,
      output: (lvl, msg) => outputs.push(`${lvl}:${msg}`),
    });

    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(outputs).toEqual(['warn:warn', 'error:error']);
  });

  it('should default to console output when no custom output is provided', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new Logger();
    logger.info('hello');
    expect(consoleSpy).toHaveBeenCalledWith('[info] hello');
    consoleSpy.mockRestore();
  });
});
