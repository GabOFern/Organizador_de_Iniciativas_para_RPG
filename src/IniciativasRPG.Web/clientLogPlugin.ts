import fs from 'node:fs';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function pad(value: number, width = 2) {
  return String(value).padStart(width, '0');
}

function formatLogLine(date: Date, level: LogLevel, text: string): string {
  const ts =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}`;
  return `[${ts}] [${level}] - ${text}`;
}

function dayStamp(date: Date) {
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}`
  );
}

const levels = new Set<LogLevel>(['DEBUG', 'INFO', 'WARN', 'ERROR']);

export function clientLogPlugin(repoRoot: string): Plugin {
  const logDir = path.join(repoRoot, 'logs', 'front');

  return {
    name: 'iniciativasrpg-client-log',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            const body = JSON.parse(raw) as { level?: string; text?: string };
            const level = body.level as LogLevel;
            const text = typeof body.text === 'string' ? body.text : '';
            if (!levels.has(level) || !text) {
              res.statusCode = 400;
              res.end();
              return;
            }

            fs.mkdirSync(logDir, { recursive: true });
            const filePath = path.join(logDir, `web-${dayStamp(new Date())}.log`);
            const line = formatLogLine(new Date(), level, text);
            fs.appendFileSync(filePath, `${line}\n`, 'utf8');
            res.statusCode = 204;
            res.end();
          } catch {
            res.statusCode = 400;
            res.end();
          }
        });
      };

      server.middlewares.use('/__client-log', handler);
    },
  };
}
