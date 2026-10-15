import fs from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import { formatLogLine, logger, setLoggerFileSink } from '../logger';
import { withTestLogFile } from './testLogFiles';

const logLinePattern =
  /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[(DEBUG|INFO|WARN|ERROR)\] - .+$/;

describe('formatLogLine', () => {
  it('F1: casa com o formato padrão e contém o texto', () => {
    const date = new Date(2026, 9, 15, 19, 5, 30, 123);
    const line = formatLogLine(date, 'ERROR', 'algo falhou');
    expect(line).toMatch(logLinePattern);
    expect(line).toContain('algo falhou');
    expect(line).toContain('[ERROR]');
  });
});

describe('logger file sink', () => {
  afterEach(() => {
    setLoggerFileSink(null);
  });

  it('F2: error grava linha no arquivo de teste', async () => {
    await withTestLogFile('logger-f2.log', async (logPath, append) => {
      setLoggerFileSink(append);
      logger.error('falha de request');
      const content = fs.readFileSync(logPath, 'utf8').trimEnd();
      expect(content).toMatch(logLinePattern);
      expect(content).toContain('falha de request');
      expect(content).toContain('[ERROR]');
    });
  });

  it('F3: após asserts OK o arquivo do run é removido', async () => {
    let retainedPath = '';
    await withTestLogFile('logger-f3.log', async (logPath, append) => {
      retainedPath = logPath;
      setLoggerFileSink(append);
      logger.info('ok');
      expect(fs.existsSync(logPath)).toBe(true);
    });
    expect(fs.existsSync(retainedPath)).toBe(false);
  });

  it('F4: helper retém arquivo quando o callback falha', async () => {
    const name = 'logger-f4-retain.log';
    let retainedPath = '';
    await expect(
      withTestLogFile(name, async (logPath, append) => {
        retainedPath = logPath;
        setLoggerFileSink(append);
        logger.error('vai falhar o assert');
        expect(true).toBe(false);
      }),
    ).rejects.toThrow();

    expect(fs.existsSync(retainedPath)).toBe(true);
    fs.unlinkSync(retainedPath);
  });
});
