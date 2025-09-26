import type { ExtensionInstallMetadata } from '@google/gemini-cli-core';

interface InstallArgs {
  source?: string;
  path?: string;
  ref?: string;
  autoUpdate?: boolean;
}

function getGitInstallMetadata(args: InstallArgs): ExtensionInstallMetadata {
  const { source } = args;
  if (!source) {
    throw new Error('Git source is required.');
  }
  if (
    source.startsWith('http://') ||
    source.startsWith('https://') ||
    source.startsWith('git@') ||
    source.startsWith('sso://')
  ) {
    return {
      source,
      type: 'git',
      ref: args.ref,
      autoUpdate: args.autoUpdate,
    };
  } else {
    throw new Error(`The source "${source}" is not a valid URL format.`);
  }
}

function getLocalInstallMetadata(args: InstallArgs): ExtensionInstallMetadata {
  const { path } = args;
  if (!path) {
    throw new Error('Local path is required.');
  }
  return {
    source: path,
    type: 'local',
    autoUpdate: args.autoUpdate,
  };
}

export function getInstallMetadata(args: InstallArgs): ExtensionInstallMetadata {
  if (args.source) {
    return getGitInstallMetadata(args);
  } else if (args.path) {
    return getLocalInstallMetadata(args);
  } else {
    // This should not be reached due to the yargs check.
    throw new Error('Either --source or --path must be provided.');
  }
}
