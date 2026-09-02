import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  targetLogFile: path.resolve(__dirname, '..', process.env.TARGET_LOG_FILE || '../app1-demo-backend/logs/error.log'),
  targetAppRoot: path.resolve(__dirname, '..', process.env.TARGET_APP_ROOT || '../app1-demo-backend'),
  
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  
  githubToken: process.env.GITHUB_TOKEN || '',
  githubRepoOwner: process.env.GITHUB_REPO_OWNER || '',
  githubRepoName: process.env.GITHUB_REPO_NAME || '',
  githubBaseBranch: process.env.GITHUB_BASE_BRANCH || 'main',
  
  simulatePr: process.env.SIMULATE_PR === 'true' || !process.env.GITHUB_TOKEN,
  cooldownMs: parseInt(process.env.COOLDOWN_MS || '10000', 10)
};
