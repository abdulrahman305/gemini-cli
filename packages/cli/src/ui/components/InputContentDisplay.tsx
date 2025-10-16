import type React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import stringWidth from 'string-width';
import { theme } from '../semantic-colors.js';
import { cpSlice, cpLen, toCodePoints } from '../utils/textUtils.js';
import { parseInputForHighlighting, buildSegmentsForVisualSlice } from '../utils/highlight.js';
import type { TextBuffer } from './shared/text-buffer.js';

interface InputContentDisplayProps {
  buffer: TextBuffer;
  placeholder?: string;
  focus: boolean;
  inputWidth: number;
  linesToRender: readonly string[];
  scrollVisualRow: number;
  cursorVisualRowAbsolute: number;
  cursorVisualColAbsolute: number;
  inlineGhost: string;
  additionalLines: string[];
  showCursor: boolean;
}

export const InputContentDisplay: React.FC<InputContentDisplayProps> = ({
  buffer,
  placeholder,
  focus,
  inputWidth,
  linesToRender,
  scrollVisualRow,
  cursorVisualRowAbsolute,
  cursorVisualColAbsolute,
  inlineGhost,
  additionalLines,
  showCursor,
}) => {
  return (
    <Box flexGrow={1} flexDirection="column">
      {buffer.text.length === 0 && placeholder ? (
        showCursor ? (
          <Text>
            {chalk.inverse(placeholder.slice(0, 1))}
            <Text color={theme.text.secondary}>{placeholder.slice(1)}</Text>
          </Text>
        ) : (
          <Text color={theme.text.secondary}>{placeholder}</Text>
        )
      ) : (
        linesToRender
          .map((lineText, visualIdxInRenderedSet) => {
            const absoluteVisualIdx =
              scrollVisualRow + visualIdxInRenderedSet;
            const mapEntry = buffer.visualToLogicalMap[absoluteVisualIdx];
            const cursorVisualRow =
              cursorVisualRowAbsolute - scrollVisualRow;
            const isOnCursorLine =
              focus && visualIdxInRenderedSet === cursorVisualRow;

            const renderedLine: React.ReactNode[] = [];

            const [logicalLineIdx, logicalStartCol] = mapEntry;
            const logicalLine = buffer.lines[logicalLineIdx] || '';
            const tokens = parseInputForHighlighting(
              logicalLine,
              logicalLineIdx,
            );

            const visualStart = logicalStartCol;
            const visualEnd = logicalStartCol + cpLen(lineText);
            const segments = buildSegmentsForVisualSlice(
              tokens,
              visualStart,
              visualEnd,
            );

            let charCount = 0;
            segments.forEach((seg, segIdx) => {
              const segLen = cpLen(seg.text);
              let display = seg.text;

              if (isOnCursorLine) {
                const relativeVisualColForHighlight =
                  cursorVisualColAbsolute;
                const segStart = charCount;
                const segEnd = segStart + segLen;
                if (
                  relativeVisualColForHighlight >= segStart &&
                  relativeVisualColForHighlight < segEnd
                ) {
                  const charToHighlight = cpSlice(
                    seg.text,
                    relativeVisualColForHighlight - segStart,
                    relativeVisualColForHighlight - segStart + 1,
                  );
                  const highlighted = showCursor
                    ? chalk.inverse(charToHighlight)
                    : charToHighlight;
                  display =
                    cpSlice(
                      seg.text,
                      0,
                      relativeVisualColForHighlight - segStart,
                    ) +
                    highlighted +
                    cpSlice(
                      seg.text,
                      relativeVisualColForHighlight - segStart + 1,
                    );
                }
                charCount = segEnd;
              }

              const color =
                seg.type === 'command' || seg.type === 'file'
                  ? theme.text.accent
                  : theme.text.primary;

              renderedLine.push(
                <Text key={`token-${segIdx}`} color={color}>
                  {display}
                </Text>,
              );
            });

            const currentLineGhost = isOnCursorLine ? inlineGhost : '';
            if (
              isOnCursorLine &&
              cursorVisualColAbsolute === cpLen(lineText)
            ) {
              if (!currentLineGhost) {
                renderedLine.push(
                  <Text key={`cursor-end-${cursorVisualColAbsolute}`}>
                    {showCursor ? chalk.inverse(' ') : ' '}
                  </Text>,
                );
              }
            }

            const showCursorBeforeGhost =
              focus &&
              isOnCursorLine &&
              cursorVisualColAbsolute === cpLen(lineText) &&
              currentLineGhost;

            return (
              <Box key={`line-${visualIdxInRenderedSet}`} height={1}>
                <Text>
                  {renderedLine}
                  {showCursorBeforeGhost &&
                    (showCursor ? chalk.inverse(' ') : ' ')}
                  {currentLineGhost && (
                    <Text color={theme.text.secondary}>
                      {currentLineGhost}
                    </Text>
                  )}
                </Text>
              </Box>
            );
          })
          .concat(
            additionalLines.map((ghostLine, index) => {
              const padding = Math.max(
                0,
                inputWidth - stringWidth(ghostLine),
              );
              return (
                <Text
                  key={`ghost-line-${index}`}
                  color={theme.text.secondary}
                >
                  {ghostLine}
                  {' '.repeat(padding)}
                </Text>
              );
            }),
          )
      )}
    </Box>
  );
};
