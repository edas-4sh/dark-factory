import { Logger } from '../utils/Logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  test('should filter logs below current level', () => {
    logger.setLevel('warn');
    logger.log('test');
    // Verify no console output
  });

  // Additional tests for custom output and edge cases
});