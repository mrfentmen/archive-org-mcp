# archive org mcp

MCP server for the **Internet Archive**, the largest library on earth.

## Tools

| Tool | What it does |
|---|---|
| `search_items` | Search ~200M items, filterable by media type (software, audio, movies, texts, web…) |
| `get_item` | Full item details + file manifest with sizes/formats |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_items { query: "sonic the hedgehog prototype", mediatype: "software" }
get_item { identifier: "sonic-the-hedgehog-triple-trouble-prototype-aug-161994..." }
```

Keyless. Great for abandoned CD ROM software, bootleg concert tapes, 78rpm records, Geocities snapshots, and old Flash games. Item entries include download counts; manifests show file sizes and formats.
