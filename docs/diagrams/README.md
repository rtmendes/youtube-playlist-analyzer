# Data Flow Diagrams

This directory contains visual data flow diagrams for the YouTube Playlist Analyzer platform.

## Diagrams

| Diagram | Description |
|---|---|
| `system-architecture.mmd` | High-level system architecture showing frontend, backend, data layer, and external APIs |
| `content-generation-flow.mmd` | Content generation pipeline from data sources through AI processing to 9 output types |
| `competitor-tracking-flow.mmd` | Competitor tracking workflow from channel discovery through auto-import to reports |
| `comment-threading.mmd` | Comment threading and ranking model showing fetch, store, rank, and display layers |
| `data-manager-flow.mmd` | Data Manager unified view architecture with export and future integration paths |

## Source Files

All diagrams are generated from Mermaid `.mmd` source files in this directory. To regenerate:

```bash
manus-render-diagram diagrams/system-architecture.mmd diagrams/system-architecture.png
manus-render-diagram diagrams/content-generation-flow.mmd diagrams/content-generation-flow.png
manus-render-diagram diagrams/competitor-tracking-flow.mmd diagrams/competitor-tracking-flow.png
manus-render-diagram diagrams/comment-threading.mmd diagrams/comment-threading.png
manus-render-diagram diagrams/data-manager-flow.mmd diagrams/data-manager-flow.png
```
