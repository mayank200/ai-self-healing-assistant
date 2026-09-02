import fs from 'fs';
import chokidar from 'chokidar';
import path from 'path';

/**
 * Continuously monitors log file for new log lines.
 * 
 * @param {string} logFilePath Path to log file
 * @param {function} onErrorDetected Callback when new error log is appended
 */
export function startLogWatcher(logFilePath, onErrorDetected) {
  if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  }
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '# App 1 Error Log Stream\n', 'utf8');
  }

  let fileSize = fs.statSync(logFilePath).size;

  console.log(`[Log Watcher] Continuously monitoring: ${logFilePath}`);

  const watcher = chokidar.watch(logFilePath, {
    persistent: true,
    usePolling: true,
    interval: 500
  });

  watcher.on('change', (filePath) => {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > fileSize) {
        const stream = fs.createReadStream(filePath, {
          start: fileSize,
          end: stats.size
        });

        let data = '';
        stream.on('data', chunk => {
          data += chunk.toString('utf8');
        });

        stream.on('end', () => {
          fileSize = stats.size;
          const lines = data.split('\n').filter(line => line.trim().length > 0);

          for (const line of lines) {
            onErrorDetected(line);
          }
        });
      } else {
        fileSize = stats.size;
      }
    } catch (err) {
      console.error(`[Log Watcher] Error reading log updates: ${err.message}`);
    }
  });

  return watcher;
}
