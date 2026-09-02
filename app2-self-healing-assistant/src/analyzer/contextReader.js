import fs from 'fs';
import path from 'path';

/**
 * Reads source code content and context around the error line.
 * 
 * @param {string} absoluteFilePath Absolute path to the source file
 * @param {number} lineNumber Line number of failure
 * @returns {object} Source code content and window snippet
 */
export function getSourceContext(absoluteFilePath, lineNumber) {
  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`Target source file not found at: ${absoluteFilePath}`);
  }

  const fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
  const lines = fileContent.split('\n');

  // Extract a 15-line context snippet centered around the error line
  const startLine = Math.max(1, lineNumber - 7);
  const endLine = Math.min(lines.length, lineNumber + 7);

  const snippetLines = [];
  for (let i = startLine; i <= endLine; i++) {
    const isErrorLine = i === lineNumber;
    const prefix = isErrorLine ? '>>> ' : '    ';
    snippetLines.push(`${prefix}${i.toString().padStart(4, ' ')} | ${lines[i - 1]}`);
  }

  return {
    fullSourceCode: fileContent,
    lineCount: lines.length,
    snippet: snippetLines.join('\n'),
    targetLineContent: lines[lineNumber - 1] || ''
  };
}
