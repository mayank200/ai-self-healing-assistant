import { Octokit } from '@octokit/rest';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

/**
 * Creates a GitHub Pull Request (or simulated PR payload in dry-run mode).
 * 
 * @param {string} branchName Feature branch containing the fix
 * @param {string} prTitle Pull Request title
 * @param {string} prBody Pull Request body markdown
 * @returns {Promise<object>} PR details (url, number, mode)
 */
export async function createPullRequest(branchName, prTitle, prBody) {
  // If simulated mode or missing GitHub credentials
  if (config.simulatePr || !config.githubToken || !config.githubRepoOwner || !config.githubRepoName) {
    return createSimulatedPullRequest(branchName, prTitle, prBody);
  }

  try {
    const octokit = new Octokit({ auth: config.githubToken });

    // Create Pull Request using Octokit API
    const response = await octokit.rest.pulls.create({
      owner: config.githubRepoOwner,
      repo: config.githubRepoName,
      title: prTitle,
      head: branchName,
      base: config.githubBaseBranch,
      body: prBody
    });

    return {
      success: true,
      mode: 'LIVE_GITHUB_API',
      prNumber: response.data.number,
      prUrl: response.data.html_url,
      branch: branchName
    };
  } catch (err) {
    console.warn(`[GitHub Service] Live GitHub PR creation failed: ${err.message}. Falling back to Simulated PR payload.`);
    return createSimulatedPullRequest(branchName, prTitle, prBody);
  }
}

/**
 * Generates local simulated Pull Request artifact.
 */
function createSimulatedPullRequest(branchName, prTitle, prBody) {
  const simulatedPrNumber = Math.floor(100 + Math.random() * 900);
  const repoOwner = config.githubRepoOwner || 'dev-team';
  const repoName = config.githubRepoName || 'ai-self-healing-assistant';
  const prUrl = `https://github.com/${repoOwner}/${repoName}/pull/${simulatedPrNumber}`;

  const payload = {
    prNumber: simulatedPrNumber,
    prUrl: prUrl,
    title: prTitle,
    headBranch: branchName,
    baseBranch: config.githubBaseBranch,
    body: prBody,
    createdTimestamp: new Date().toISOString(),
    status: 'OPEN',
    simulationMode: true
  };

  // Save payload artifact to logs
  const prLogDir = path.resolve(config.targetAppRoot, 'logs/pull-requests');
  if (!fs.existsSync(prLogDir)) {
    fs.mkdirSync(prLogDir, { recursive: true });
  }

  const payloadFilePath = path.join(prLogDir, `pr-${simulatedPrNumber}.json`);
  fs.writeFileSync(payloadFilePath, JSON.stringify(payload, null, 2), 'utf8');

  return {
    success: true,
    mode: 'SIMULATED_DRY_RUN',
    prNumber: simulatedPrNumber,
    prUrl: prUrl,
    branch: branchName,
    payloadPath: payloadFilePath
  };
}
