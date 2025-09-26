import { execSync } from 'node:child_process';
import semver from 'semver';

export function getLatestTag(pattern) {
  const command = `git tag -l '${pattern}'`;
  try {
    const tags = execSync(command)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
    if (tags.length === 0) return '';

    // Convert tags to versions (remove 'v' prefix) and sort by semver
    const versions = tags
      .map((tag) => tag.replace(/^v/, ''))
      .filter((version) => semver.valid(version))
      .sort((a, b) => semver.rcompare(a, b)); // rcompare for descending order

    if (versions.length === 0) return '';

    // Return the latest version with 'v' prefix restored
    return `v${versions[0]}`;
  } catch (error) {
    console.error(
      `Failed to get latest git tag for pattern "${pattern}": ${error.message}`,
    );
    return '';
  }
}
