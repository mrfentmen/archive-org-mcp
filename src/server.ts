import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ArchiveError,
  fmtSize,
  formatItem,
  getItemDetails,
  searchItems,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "archive-org-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_items",
    "Search the Internet Archive — old software, abandoned CD-ROM games, " +
      "bootleg concert tapes, 78rpm records, dead web pages, and more.",
    {
      query: z.string().describe("Search query, e.g. 'Windows 95' or 'sonic hedgehog prototype'"),
      mediatype: z
        .enum(["software", "audio", "movies", "texts", "image", "web"])
        .optional()
        .describe("Restrict to a media type"),
      limit: z.number().int().min(1).max(25).default(8),
    },
    async ({ query, mediatype, limit }) => {
      try {
        const items = await searchItems(query, mediatype, limit)
        if (items.length === 0) return text(`Nothing in the Archive matches "${query}".`)
        return text(
          `Archive.org results for "${query}"${mediatype ? ` (${mediatype})` : ""}:\n\n` +
            items.map((it, i) => formatItem(it, i)).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_item",
    "Get full details + file manifest for an archive.org item.",
    { identifier: z.string().describe("Item identifier from search_items") },
    async ({ identifier }) => {
      try {
        const d = await getItemDetails(identifier)
        const lines = [
          d.title ?? d.identifier,
          d.mediatype ? `Type: ${d.mediatype}` : "",
          d.description ? d.description.slice(0, 400) : "",
          `https://archive.org/details/${d.identifier}`,
          "",
          `Files (${d.files.length} shown):`,
          ...d.files.map(
            (f, i) =>
              `${i + 1}. ${f.name}${f.format ? ` [${f.format}]` : ""}${f.size ? ` ${fmtSize(f.size)}` : ""}${f.length ? ` (${f.length})` : ""}`
          ),
        ].filter(Boolean)
        return text(lines.join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ArchiveError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
