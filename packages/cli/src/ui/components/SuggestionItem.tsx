import { Box, Text } from 'ink';
import { PrepareLabel, MAX_WIDTH } from './PrepareLabel.js';
import { CommandKind } from '../commands/types.js';
import { Colors } from '../colors.js';
import { theme } from '../semantic-colors.js';

export interface Suggestion {
  label: string;
  value: string;
  description?: string;
  matchedIndex?: number;
  commandKind?: CommandKind;
}

interface SuggestionItemProps {
  suggestion: Suggestion;
  originalIndex: number;
  isActive: boolean;
  isExpanded: boolean;
  textColor: string;
  isLong: boolean;
  labelElement: React.ReactElement;
  mode: 'reverse' | 'slash';
  commandColumnWidth: number;
}

export const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  originalIndex,
  isActive,
  isExpanded,
  textColor,
  isLong,
  labelElement,
  mode,
  commandColumnWidth,
}) => {
  return (
    <Box key={`${suggestion.value}-${originalIndex}`} flexDirection="row">
      <Box
        {...(mode === 'slash'
          ? { width: commandColumnWidth, flexShrink: 0 as const }
          : { flexShrink: 1 as const })}
      >
        <Box>
          {labelElement}
          {suggestion.commandKind === CommandKind.MCP_PROMPT && (
            <Text color={textColor}> [MCP]</Text>
          )}
        </Box>
      </Box>

      {suggestion.description && (
        <Box flexGrow={1} paddingLeft={3}>
          <Text color={textColor} wrap="truncate">
            {suggestion.description}
          </Text>
        </Box>
      )}
      {isActive && isLong && (
        <Box>
          <Text color={Colors.Gray}>{isExpanded ? ' ← ' : ' → '}</Text>
        </Box>
      )}
    </Box>
  );
};
