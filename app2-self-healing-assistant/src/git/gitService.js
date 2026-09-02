import simpleGit from 'simple-git';
import path from 'path';

/**
 * Creates a git feature branch, stages modified files, commits the fix, and optionally pushes to remote.
 * 
 * @param {string} repoRoot Absolute directory path to git repository root
 * @param {string} relativeFilePath Relative path to modified file
 * @param {string} commitMessage Detailed commit message
 * @param {string} branchPrefix Feature branch name prefix
 * @param {boolean} pushToRemote Whether to push branch to git origin remote
 * @returns {Promise<object>} Git commit details including branch name and commit SHA
 */
export async function commitCodeFix(repoRoot, relativeFilePath, commitMessage, branchPrefix = 'fix/self-heal', pushToRemote = false) {
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

  if (pushToRemote) {
    try {
      console.log(`[Git Service] Pushing branch '${branchName}' to origin remote...`);
      await git.push('origin', branchName, ['-u']);
      console.log(`[Git Service] Branch '${branchName}' successfully pushed to GitHub!`);
    } catch (pushErr) {
      console.warn(`[Git Service] Could not push to origin remote (${pushErr.message}). Continuing...`);
    }
  }

  return {
    branchName: branchName,
    commitSha: commitResult.commit || 'local-commit',
    summary: commitResult.summary
  };
}
