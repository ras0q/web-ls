/**
 * Markdown link parser.
 * Pure functions for extracting links from Markdown text.
 */

/**
 * Extract a Markdown link URL at the given character position in a line.
 * Returns the URL if cursor is within a link, null otherwise.
 */
export function extractLinkAtPosition(
  line: string,
  character: number,
): string | null {
  // Find all Markdown links in the line
  // Use non-greedy matching to handle malformed links correctly
  const linkPattern = /\[([^\]]+)\]\(([^)]+?)\)/g;
  let match;

  while ((match = linkPattern.exec(line)) !== null) {
    const linkStart = match.index;
    const linkEnd = linkStart + match[0].length;

    // Check if cursor is within this link's boundaries
    if (character >= linkStart && character < linkEnd) {
      return match[2]; // Return the URL (second capture group)
    }
  }

  return null;
}
