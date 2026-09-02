import crypto from 'crypto';
import path from 'path';

/**
 * Parses structured JSON error log entries or raw stack traces.
 * Extracts message, file path, line number, column, and error signature.
 * 
 * @param {string|object} logEntry 
 * @param {string} targetAppRoot Absolute path to target app root
 * @returns {object|null} Extracted error metadata
 */
export function parseErrorLog(logEntry, targetAppRoot) {
  let logObj = null;

  if (typeof logEntry === 'string') {
    const trimmed = logEntry.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;

    try {
      logObj = JSON.parse(trimmed);
    } catch {
      logObj = { message: trimmed, stack: trimmed };
    }
  } else if (typeof logEntry === 'object' && logEntry !== null) {
    logObj = logEntry;
  }

  if (!logObj || (!logObj.stack && !logObj.message)) {
    return null;
  }

  const stack = logObj.stack || logObj.message;
  const message = logObj.message || stack.split('\n')[0];

  // Regex pattern to extract file paths and line numbers from V8 Node stack traces:
  // e.g. "at getUserProfileById (file:///.../src/services/userService.js:24:43)"
  // or "at getUserProfileById (.../src/services/userService.js:24:43)"
  // or "at ... (C:\...\src\services\userService.js:24:43)"
  const stackLines = stack.split('\n');
  let targetFile = null;
  let lineNumber = null;
  let columnNumber = null;

  for (const line of stackLines) {
    // Ignore internal node modules, node:internal, winston, or express internals
    if (line.includes('node:internal') || line.includes('node_modules') || line.includes('logger.js')) {
      continue;
    }

    const match = line.match(/(?:file:\/\/\/)?([a-zA-Z]:[\\/][^:\n]+|[\\/][^:\n]+|\.?\.?[\\/][^:\n]+):(\d+):(\d+)/);
    if (match) {
      let rawPath = match[1];
      const lineNo = parseInt(match[2], 10);
      const colNo = parseInt(match[3], 10);

      // Clean file URL prefix if present
      rawPath = rawPath.replace(/^file:\/\/\//, '');

      // Check if file is within app source
      if (rawPath.includes('src') || rawPath.includes('app1-demo-backend')) {
        targetFile = rawPath;
        lineNumber = lineNo;
        columnNumber = colNo;
        break;
      }
    }
  }

  if (!targetFile) {
    return null;
  }

  // Normalize path relative to targetAppRoot
  let relativeFilePath = targetFile;
  if (path.isAbsolute(targetFile)) {
    relativeFilePath = path.relative(targetAppRoot, targetFile);
  }
  // Replace Windows backslashes with forward slashes for clean relative paths
  relativeFilePath = relativeFilePath.replace(/\\/g, '/');

  // Compute a unique signature hash for error deduplication
  const hashSource = `${message}_${relativeFilePath}_${lineNumber}`;
  const errorHash = crypto.createHash('sha256').update(hashSource).digest('hex');

  return {
    timestamp: logObj.timestamp || new Date().toISOString(),
    message: message,
    stack: stack,
    filePath: relativeFilePath,
    absoluteFilePath: path.isAbsolute(targetFile) ? targetFile : path.join(targetAppRoot, relativeFilePath),
    lineNumber: lineNumber,
    columnNumber: columnNumber,
    errorHash: errorHash
  };
}
