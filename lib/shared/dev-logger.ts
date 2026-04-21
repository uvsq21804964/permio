type DevLoggerMethod = 'error' | 'info' | 'log' | 'warn';

const isEnabled = process.env.NODE_ENV !== 'production';

function write(method: DevLoggerMethod, ...args: unknown[]) {
  if (!isEnabled) return;

  const logger = console[method] as (...params: unknown[]) => void;
  logger(...args);
}

export const devLogger = {
  enabled: isEnabled,
  error: (...args: unknown[]) => write('error', ...args),
  info: (...args: unknown[]) => write('info', ...args),
  log: (...args: unknown[]) => write('log', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
} as const;
