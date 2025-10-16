import { Box, Text } from 'ink';
import { ContextSummaryDisplay } from './ContextSummaryDisplay.js';
import { AutoAcceptIndicator } from './AutoAcceptIndicator.js';
import { ShellModeIndicator } from './ShellModeIndicator.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { theme } from '../semantic-colors.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { ApprovalMode } from '@google/gemini-cli-core';

export const ComposerStatusDisplay = () => {
  const config = useConfig();
  const settings = useSettings();
  const uiState = useUIState();
  const terminalWidth = process.stdout.columns;
  const isNarrow = isNarrowWidth(terminalWidth);

  const { contextFileNames, showAutoAcceptIndicator } = uiState;

  return (
    <Box
      marginTop={1}
      justifyContent={
        settings.merged.ui?.hideContextSummary
          ? 'flex-start'
          : 'space-between'
      }
      width="100%"
      flexDirection={isNarrow ? 'column' : 'row'}
      alignItems={isNarrow ? 'flex-start' : 'center'}
    >
      <Box marginRight={1}>
        {process.env['GEMINI_SYSTEM_MD'] && (
          <Text color={theme.status.error}>|⌐■_■| </Text>
        )}
        {uiState.ctrlCPressedOnce ? (
          <Text color={theme.status.warning}>
            Press Ctrl+C again to exit.
          </Text>
        ) : uiState.ctrlDPressedOnce ? (
          <Text color={theme.status.warning}>
            Press Ctrl+D again to exit.
          </Text>
        ) : uiState.showEscapePrompt ? (
          <Text color={theme.text.secondary}>Press Esc again to clear.</Text>
        ) : (
          !settings.merged.ui?.hideContextSummary && (
            <ContextSummaryDisplay
              ideContext={uiState.ideContextState}
              geminiMdFileCount={uiState.geminiMdFileCount}
              contextFileNames={contextFileNames}
              mcpServers={config.getMcpServers()}
              blockedMcpServers={config.getBlockedMcpServers()}
              showToolDescriptions={uiState.showToolDescriptions}
            />
          )
        )}
      </Box>
      <Box paddingTop={isNarrow ? 1 : 0}>
        {showAutoAcceptIndicator !== ApprovalMode.DEFAULT &&
          !uiState.shellModeActive && (
            <AutoAcceptIndicator approvalMode={showAutoAcceptIndicator} />
          )}
        {uiState.shellModeActive && <ShellModeIndicator />}
      </Box>
    </Box>
  );
};
