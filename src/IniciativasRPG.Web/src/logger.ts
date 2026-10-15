export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogFileSink = (line: string) => void;

let fileSink: LogFileSink | null = null;

export function setLoggerFileSink(sink: LogFileSink | null) {
  fileSink = sink;
}

function pad(value: number, width = 2) {
  return String(value).padStart(width, '0');
}

export function formatLogLine(date: Date, level: LogLevel, text: string): string {
  const ts =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}`;
  return `[${ts}] [${level}] - ${text}`;
}

function emitToConsole(level: LogLevel, line: string) {
  switch (level) {
    case 'DEBUG':
      console.debug(line);
      break;
    case 'INFO':
      console.info(line);
      break;
    case 'WARN':
      console.warn(line);
      break;
    case 'ERROR':
      console.error(line);
      break;
  }
}

function shouldPostToDevServer() {
  return (
    import.meta.env.DEV === true &&
    import.meta.env.MODE !== 'test' &&
    typeof window !== 'undefined'
  );
}

function write(level: LogLevel, text: string) {
  const line = formatLogLine(new Date(), level, text);
  emitToConsole(level, line);
  fileSink?.(line);

  if (shouldPostToDevServer()) {
    void fetch('/__client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, text }),
      keepalive: true,
    }).catch(() => {
      /* ignore transport errors */
    });
  }
}

export const logger = {
  debug: (text: string) => write('DEBUG', text),
  info: (text: string) => write('INFO', text),
  warn: (text: string) => write('WARN', text),
  error: (text: string) => write('ERROR', text),
};
