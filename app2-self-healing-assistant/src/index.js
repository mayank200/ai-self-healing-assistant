import { config } from './config.js';
import { startLogWatcher } from './watcher/logWatcher.js';
import { parseErrorLog } from './analyzer/stackParser.js';
import { getSourceContext } from './analyzer/contextReader.js';
import { generateCodeFix } from './ai/aiService.js';
import { applyCodePatch } from './patcher/codePatcher.js';
import { commitCodeFix } from './git/gitService.js';
import { createPullRequest } from './github/prService.js';
import chalk from 'chalk';

const processedErrors = new Map();

console.log(chalk.bold.cyan('\n======================================================'));
console.log(chalk.bold.cyan('  🤖 AI-Powered Self-Healing Developer Assistant (App 2)'));
console.log(chalk.bold.cyan('======================================================\n'));
console.log(chalk.gray(`Target App Root : ${config.targetAppRoot}`));
console.log(chalk.gray(`Monitoring Log  : ${config.targetLogFile}`));
console.log(chalk.gray(`AI Provider     : ${config.geminiApiKey ? 'Gemini 2.5 Flash API' : 'Rule Engine Fallback (Offline Mode)'}`));
console.log(chalk.gray(`PR Mode         : ${config.simulatePr ? 'Simulated / Local Dry-Run' : 'Live GitHub API'}`));
console.log(chalk.cyan('\n[Assistant Status] Daemon active and waiting for error logs...\n'));

// Start continuous log file watching
startLogWatcher(config.targetLogFile, async (logLine) => {
  try {
    const errorInfo = parseErrorLog(logLine, config.targetAppRoot);
    if (!errorInfo) return;

    // Check cooldown de-duplication
    const now = Date.now();
    const lastProcessed = processedErrors.get(errorInfo.errorHash);
    if (lastProcessed && (now - lastProcessed) < config.cooldownMs) {
      console.log(chalk.yellow(`[Deduplicator] Skipping duplicate error recently processed (${errorInfo.filePath})`));
      return;
    }
    processedErrors.set(errorInfo.errorHash, now);

    console.log(chalk.bold.red(`\n🚨 [STEP 1: Error Detected]`));
    console.log(`   Message : ${chalk.red(errorInfo.message)}`);
    console.log(`   Location: ${chalk.yellow(errorInfo.filePath)} (Line ${errorInfo.lineNumber}, Col ${errorInfo.columnNumber})`);

    console.log(chalk.bold.blue(`\n🔍 [STEP 2: Analyzing Log & Context]`));
    const sourceContext = getSourceContext(errorInfo.absoluteFilePath, errorInfo.lineNumber);
    console.log(chalk.gray(`   Loaded ${sourceContext.lineCount} lines of source code context.`));

    console.log(chalk.bold.magenta(`\n🧠 [STEP 3: AI Fix Generation]`));
    console.log(`   Prompting AI engine to resolve root cause...`);
    const aiResult = await generateCodeFix(errorInfo, sourceContext);
    console.log(chalk.green(`   Root Cause Identified: "${aiResult.rootCause}"`));

    console.log(chalk.bold.yellow(`\n🔧 [STEP 4: Applying Code Patch]`));
    const patchStatus = applyCodePatch(errorInfo.absoluteFilePath, aiResult.fixedSourceCode);
    console.log(chalk.green(`   ${patchStatus.message}`));

    console.log(chalk.bold.cyan(`\n📦 [STEP 5: Creating Git Commit]`));
    const gitResult = await commitCodeFix(
      config.targetAppRoot,
      errorInfo.filePath,
      aiResult.prTitle,
      'fix/self-heal',
      !config.simulatePr
    );
    console.log(chalk.green(`   Branch Created: ${gitResult.branchName}`));
    console.log(chalk.gray(`   Commit SHA    : ${gitResult.commitSha}`));

    console.log(chalk.bold.green(`\n🚀 [STEP 6: Raising GitHub Pull Request]`));
    const prResult = await createPullRequest(
      gitResult.branchName,
      aiResult.prTitle,
      aiResult.prBody
    );

    console.log(chalk.bold.green(`\n🎉 [Self-Healing Complete!]`));
    console.log(chalk.bold(`   PR Mode : `) + chalk.cyan(prResult.mode));
    console.log(chalk.bold(`   PR Title: `) + aiResult.prTitle);
    console.log(chalk.bold(`   PR URL  : `) + chalk.underline.blue(prResult.prUrl));
    if (prResult.payloadPath) {
      console.log(chalk.gray(`   Payload : Saved to ${prResult.payloadPath}`));
    }
    console.log(chalk.cyan('\n------------------------------------------------------\n'));
  } catch (err) {
    console.error(chalk.bold.red(`\n❌ [Self-Healing Error] Failed to process error log: ${err.message}`));
    console.error(err.stack);
  }
});
