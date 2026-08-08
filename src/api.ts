/**
 * Internet Archive client — keyless.
 *  - advancedsearch.php: full-text + metadata search over ~200M items.
 *  - metadata/{identifier}: file manifests for an item.
 */
const SEARCH = "https://archive.org/advancedsearch.php"
const META = "https://archive.org/metadata"

export class ArchiveError extends Error {}

export interface ArchiveItem {
  identifier: string
  title?: string
  mediatype?: string
  year?: string
  downloads?: number
  collection?: string[]
  description?: string
}

export interface ArchiveFile {
  name: string
  size?: number
  format?: string
  length?: string
  title?: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "archive-org-mcp/1.0" } })
  if (!res.ok) throw new ArchiveError(`Internet Archive error ${res.status} for ${url.slice(0, 120)}`)
  return (await res.json()) as T
}

export async function searchItems(
  query: string,
  mediatype: string | undefined,
  limit = 8
): Promise<ArchiveItem[]> {
  const q = mediatype ? `(${query}) AND mediatype:${mediatype}` : query
  const fl = ["identifier", "title", "mediatype", "year", "downloads", "collection", "description"].join(",")
  const url = `${SEARCH}?q=${encodeURIComponent(q)}&fl[]=${fl}&rows=${limit}&page=1&output=json`
  const data = await getJson<{ response?: { docs?: any[] } }>(url)
  return (data.response?.docs ?? []).map((d) => ({
    identifier: d.identifier ?? "",
    title: d.title ?? d.identifier,
    mediatype: d.mediatype,
    year: d.year,
    downloads: d.downloads,
    collection: d.collection,
    description: d.description,
  }))
}

export async function getItemDetails(identifier: string): Promise<{
  identifier: string
  title?: string
  mediatype?: string
  description?: string
  files: ArchiveFile[]
}> {
  const data = await getJson<any>(`${META}/${encodeURIComponent(identifier)}`)
  const files: ArchiveFile[] = (data.files ?? [])
    .filter((f: any) => f.name && !f.name.endsWith("_files.xml") && !f.name.endsWith("_meta.xml"))
    .map((f: any) => ({
      name: f.name ?? "",
      size: f.size,
      format: f.format,
      length: f.length,
      title: f.title,
    }))
    .slice(0, 30)
  return {
    identifier: data.metadata?.identifier ?? identifier,
    title: data.metadata?.title ?? data.metadata?.identifier,
    mediatype: data.metadata?.mediatype,
    description: data.metadata?.description,
    files,
  }
}

export function fmtSize(bytes?: number): string {
  if (!bytes) return ""
  const units = ["B", "KB", "MB", "GB", "TB"]
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

export function formatItem(it: ArchiveItem, index: number): string {
  const meta = [
    it.mediatype,
    it.year,
    it.downloads ? `${it.downloads.toLocaleString()} downloads` : "",
  ]
    .filter(Boolean)
    .join(" · ")
  const lines = [
    `${index + 1}. ${it.title ?? it.identifier} [${it.identifier}]`,
    meta,
    `https://archive.org/details/${it.identifier}`,
  ].filter(Boolean)
  return lines.join("\n")
}
