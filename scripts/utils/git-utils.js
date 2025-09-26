import { execSync } from 'node:child_process';

export function getGitCommitHash(): string {
  try {
    const gitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
    }).trim();
    return gitHash || 'N/A';
  } catch {
    return 'N/A'; // Return N/A if git command fails
  }
}
