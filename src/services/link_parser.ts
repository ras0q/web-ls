import { createReadStream } from "node:fs";
import { createInterface as createReadlineInterface } from "node:readline";
import type { Range, TextDocumentPositionParams } from "vscode-languageserver";

// Matches:
// - Markdown links: [text](url)
// - Autolinks: <url>
// - Plain URLs: http(s)://...
const MARKDOWN_LINK_PATTERN =
  /\[([^\]]+)\]\(([^)]+?)\)|<([^>]+)>|(https?:\/\/[^\s<>]+)/g;

export async function extractUrl(
  params: TextDocumentPositionParams,
): Promise<
  {
    url: string;
    range: Range;
  } | null
> {
  const match = await extractPattern(params, MARKDOWN_LINK_PATTERN);
  if (!match) {
    return null;
  }

  // match[2]: markdown [text](url)
  // match[3]: <url>
  // match[4]: bare url
  const url = match[2] || match[3] || match[4] || null;
  if (!url) {
    return null;
  }

  return {
    url,
    range: {
      start: {
        line: params.position.line,
        character: match.index,
      },
      end: {
        line: params.position.line,
        character: match.index + match[0].length,
      },
    },
  };
}

async function extractPattern(
  params: TextDocumentPositionParams,
  pattern: RegExp,
): Promise<RegExpExecArray | null> {
  const filePath = params.textDocument.uri.replace("file://", "");
  const fileStream = createReadStream(filePath);
  const lineNumber = params.position.line; // NOTE: 0-indexed
  const line = await getLine(fileStream, lineNumber);
  fileStream.close();
  if (!line) {
    return null;
  }

  const character = params.position.character;
  const matches = line.matchAll(pattern);
  for (const match of matches) {
    const linkStart = match.index;
    const linkEnd = linkStart + match[0].length;

    if (character >= linkStart && character < linkEnd) {
      return match;
    }
  }

  return null;
}

async function getLine(
  input: NodeJS.ReadableStream,
  lineNumber: number,
): Promise<string | null> {
  const rl = createReadlineInterface({ input });
  let currentLine = 0;
  for await (const line of rl) {
    if (currentLine === lineNumber) {
      rl.close();
      return line;
    }
    currentLine++;
  }

  return null;
}
