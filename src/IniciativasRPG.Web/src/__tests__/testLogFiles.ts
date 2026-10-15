import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');

export function frontTestLogPath(name: string) {
  return path.join(repoRoot, 'logs', 'front', 'test-run', name);
}

/**
 * Executa o callback com um arquivo de log.
 * Se o callback concluir sem erro, o arquivo é removido.
 * Se falhar, o arquivo permanece para diagnóstico.
 */
export async function withTestLogFile(
  name: string,
  run: (logPath: string, append: (line: string) => void) => void | Promise<void>,
) {
  const logPath = frontTestLogPath(name);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }

  const append = (line: string) => {
    fs.appendFileSync(logPath, `${line}\n`, 'utf8');
  };

  try {
    await run(logPath, append);
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  } catch (err) {
    throw err;
  }
}
