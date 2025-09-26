import type { ExtensionInstallMetadata } from '@google/gemini-cli-core';

interface InstallArgs {
  source?: string;
  path?: string;
  ref?: string;
  autoUpdate?: boolean;
}

// New interface for source resolvers
interface ExtensionSourceResolver {
  resolve(args: InstallArgs): ExtensionInstallMetadata;
}

const GitExtensionSourceResolver: ExtensionSourceResolver = {
  resolve(args: InstallArgs): ExtensionInstallMetadata {
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
  },
};

const LocalExtensionSourceResolver: ExtensionSourceResolver = {
  resolve(args: InstallArgs): ExtensionInstallMetadata {
    const { path } = args;
    if (!path) {
      throw new Error('Local path is required.');
    }
    return {
      source: path,
      type: 'local',
      autoUpdate: args.autoUpdate,
    };
  },
};

export function getInstallMetadata(args: InstallArgs): ExtensionInstallMetadata {
  if (args.source) {
    return GitExtensionSourceResolver.resolve(args);
  } else if (args.path) {
    return LocalExtensionSourceResolver.resolve(args);
  } else {
    // This should not be reached due to the yargs check.
    throw new Error('Either --source or --path must be provided.');
  }
}
