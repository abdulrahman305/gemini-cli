import type { ExtensionInstallMetadata } from '@google/gemini-cli-core';

interface InstallArgs {
  source?: string;
  path?: string;
  ref?: string;
  autoUpdate?: boolean;
}

export function getInstallMetadata(args: InstallArgs): ExtensionInstallMetadata {
  if (args.source) {
    const { source } = args;
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
  } else if (args.path) {
    return {
      source: args.path,
      type: 'local',
      autoUpdate: args.autoUpdate,
    };
  } else {
    // This should not be reached due to the yargs check.
    throw new Error('Either --source or --path must be provided.');
  }
}
