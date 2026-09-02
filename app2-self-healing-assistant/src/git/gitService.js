import simpleGit from 'simple-git';
import path from 'path';

/**
 * Creates a git feature branch, stages modified files, and commits the fix.
 * 
 * @param {string} repoRoot Absolute directory path to git repository root
 * @param {string} relativeFilePath Relative path to modified file
 * @param {string} commitMessage Detailed commit message
 * @param {string} branchPrefix Feature branch name prefix
 * @returns {Promise<object>} Git commit details including branch name and commit SHA
 */
export async function commitCodeFix(repoRoot, relativeFilePath, commitMessage, branchPrefix = 'fix/self-heal') {
  const git = simpleGit(repoRoot);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    // Initialize git repository if missing
    await git.init();
  }

  const timestamp = Date.now();
  const fileSlug = path.basename(relativeFilePath, path.extname(relativeFilePath));
  const branchName = `${branchPrefix}-${fileSlug}-${timestamp}`;

  // Checkout new feature branch
  await git.checkoutLocalBranch(branchName);

  // Stage modified file
  await git.add(relativeFilePath);

  // Commit changes
  const commitResult = await git.commit(commitMessage);

  return {
    branchName: branchName,
    commitSha: commitResult.commit || 'local-commit',
    summary: commitResult.summary
  };
}
