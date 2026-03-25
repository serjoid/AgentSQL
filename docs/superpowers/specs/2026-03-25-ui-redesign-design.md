# AgentSQL UI Redesign — Design Spec

## Overview

Complete visual redesign of the AgentSQL desktop application from a flat, generic dark theme to a polished, modern dark interface with depth, craft, and brand identity.

## Color System

### Backgrounds (Surface Elevation)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#1A1A1D` | Base canvas, deepest layer |
| `--bg-surface` | `#222226` | Panels, sidebar, AI panel |
| `--bg-elevated` | `#2A2A2F` | Toolbars, headers, dropdowns |
| `--bg-hover` | `#32323A` | Hover states on surfaces |
| `--bg-input` | `#1A1A1D` | Inset inputs (darker than surface) |

### Accents
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-cyan` | `#00E5FF` | Primary accent, active states, links |
| `--accent-cyan-dim` | `rgba(0,229,255,0.15)` | Cyan backgrounds (badges, hover) |
| `--accent-purple` | `#9B51E0` | SQL keywords, brand secondary |
| `--accent-purple-dim` | `rgba(155,81,224,0.15)` | Purple backgrounds |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#E8E8ED` | Main readable text |
| `--text-secondary` | `#9898A0` | Supporting/label text |
| `--text-muted` | `#5C5C66` | Metadata, placeholders |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Soft separators |
| `--border-medium` | `rgba(255,255,255,0.10)` | Panel edges |
| `--border-focus` | `var(--accent-cyan)` | Focus rings |

### Semantic
| Token | Value |
|-------|-------|
| `--success` | `#34D399` |
| `--warning` | `#FBBF24` |
| `--error` | `#F87171` |
| `--info` | `var(--accent-cyan)` |

## Typography

- **UI font**: Inter (already loaded)
- **Mono font**: Geist Mono (add via Google Fonts or local)
- **Fallback**: `'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace`

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Title Bar: [≡] [Logo] AgentSQL — AI-Powered DB Manager   [Execute] │
├──────┬──────────────┬───────────────────────┬───────────────────┤
│ Icon │   Sidebar    │    SQL Editor          │   AI Assistant    │
│ Strip│   Tree View  │    (Monaco)            │   Panel           │
│ 48px │   ~232px     │    flex-1              │   ~350px          │
│      │              ├───────────────────────┤                   │
│      │              │    Results Grid        │                   │
│      │              │    + footer bar        │                   │
├──────┴──────────────┴───────────────────────┴───────────────────┤
│ Status Bar: [conn] [status] [latency] [version]                  │
└─────────────────────────────────────────────────────────────────┘
```

### Icon Strip (far left, 48px)
Vertical icon column with navigation:
- Home/Database icon (top)
- Schema browser
- Connections
- Separator
- Settings (bottom)
- User avatar (bottom)

Active icon: cyan accent background pill.

### Title Bar
- Left: hamburger menu + app logo + "AgentSQL — AI-Powered Database Management System"
- Right: Execute button (prominent), Ctrl+Enter hint, AI toggle

### Sidebar Tree (~232px)
- Connection selector dropdown at top
- Expandable tree: Connection > Schemas > Tables > Columns
- Type badges for columns (int, text, numeric, etc.)
- PK/FK indicators with colored icons
- Views and Functions collapsible sections

### SQL Editor (center-top)
- Tab-style header: "</> SQL Script"
- Monaco editor with updated theme colors (purple keywords, cyan strings)
- Existing functionality preserved

### Results Grid (center-bottom)
- "RESULTS GRID" header
- Styled table with alternating row hints on hover
- Footer bar: "rows: X of Y | execution: Xms (perf_counter) | HITL (Safe/Warning)"

### AI Panel (~350px right)
- Header: "ASSISTANT" with close button
- Settings section: Provider dropdown, Model dropdown, API Key (masked) with "Save (in memory)" button
- Chat area: message bubbles with avatars (user = circle, AI = "AI" badge)
- Input area: textarea + send button
- Chat messages in Portuguese-friendly display

### Status Bar (bottom, full width)
- Left: "Conexao: {name} ({type})"
- Center: Status indicator (green dot + "Online"), Latency
- Right: "AgentSQL v0.5.0"

## Files to Modify

1. **`index.css`** — New CSS custom properties, Geist Mono font import, updated base styles
2. **`Layout.tsx`** — Add TitleBar, IconStrip, StatusBar; restructure flex layout
3. **`Sidebar.tsx`** — Remove icon strip (moved to Layout), redesign tree with type badges
4. **`Editor.tsx`** — Restyle toolbar, add results footer bar
5. **`AIPanel.tsx`** — Styled dropdowns, chat bubbles with avatars, masked API key UX
6. **`ConnectionModal.tsx`** — Apply new color tokens
7. **`ConfirmationModal.tsx`** — Apply new color tokens

## Constraints

- No new dependencies (Tailwind v4 + CSS custom properties only)
- Preserve all existing functionality and API integration
- Monaco Editor theme updates via existing SQLEditor.tsx config
- All existing Zustand stores remain unchanged
- Responsive within Tauri desktop window (min 1400x900)
