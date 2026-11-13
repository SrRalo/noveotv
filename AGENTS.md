# NoveoTV - Agent Instructions

## Project Overview
IPTV player for m3u8/TS streams with React + TypeScript + Vite + Tailwind CSS + hls.js + shaka-player.

## Key Commands
```bash
npm run dev          # Vite dev server only
npm run server       # Express API server (port 3001) only
npm run dev:all      # Both Vite + Express concurrently
npm run build        # TypeScript check + Vite build (es2015 target)
npm run preview      # Preview production build
```
**No lint, test, or typecheck scripts exist.** Type checking happens via `tsc -b` during build.

## Impeccable Skill (Design)
- Installed: `.opencode/skills/impeccable/` and `.gemini/skills/impeccable/`
- Run `/impeccable init` in AI chat to set up design context (PRODUCT.md + DESIGN.md)
- Key commands: `/impeccable audit`, `/impeccable polish`, `/impeccable critique`, `/impeccable distill`
- 23 design commands available through single `/impeccable` entry point
- For UI components or layout changes, use `/impeccable` before/after to ensure design quality

## Architecture

### Dual API Layer
- **Development**: `server/index.js` (Express on port 3001) - proxied via Vite
- **Production**: `api/channels.js` + `api/ppv.js` (Vercel serverless functions)
- Both parse the same M3U format; ensure changes work in both paths.

### Data Flow
1. `canales.txt` (M3U playlist) → parsed by both Express and Vercel APIs
2. PPV streams from external API (`api.ppv.to`) filtered to "Football" category only
3. Channels auto-refresh every 60 seconds via `useChannels` hook

### Build Compatibility
- Vite config includes Tizen TV plugin: moves `<script>` tag and removes `crossorigin`/`type="module"` attributes
- Build target: `es2015`, CSS target: `chrome49`
- This is critical for Samsung Tizen TV support - do not change without understanding implications

### Component Structure
- `src/api/channels.ts` - Fetches from API with fallback to static `canales.txt`
- `src/api/ppv.ts` - Fetches PPV streams, filters to live/upcoming within 1 hour
- `src/hooks/useChannels.ts` - Combines M3U + PPV data with 60s refresh interval
- `src/components/VideoPlayer.tsx` - HLS.js/Shaka-player with iframe support for embeds

### Player Architecture
- **HLS streams** (`type: 'hls'`): Use `hls.js` via `useHlsPlayer` hook
- **TS streams** (`type: 'ts'`): Use `shaka-player` via `useShakaPlayer` hook
- **Embed streams** (`type: 'embed'`): Use iframe directly
- shaka-player is configured with `forceTransmuxTS: true` for proper TS handling
- Low latency settings: `rebufferingGoal: 2`, `bufferingGoal: 5`

### Multiview
- Up to 4 simultaneous streams
- Toggle with `M` key or button
- Each slot has unique color: indigo, emerald, amber, rose

### Keyboard Shortcuts
- `/` - Focus search
- `↑↓` - Navigate channels
- `Enter` - Select channel
- `M` - Toggle multiview
- `F` - Toggle fullscreen

## Conventions
- **Language**: UI text in Spanish
- **Dark mode**: Tailwind `class` strategy (toggle via ThemeContext)
- **Responsive**: Mobile layout moves sidebar below player
- **TypeScript strict mode** enabled but `noUnusedLocals`/`noUnusedParameters` disabled
- **No comments** in code unless explicitly requested
- **Multi-fuente**: varias URLs de stream en líneas consecutivas bajo un mismo `#EXTINF` se parsean como `sources`; el reproductor muestra botones "Opción N" y la lista un badge "N opc."

## Deployment
- Vercel with rewrites: `/api/*` → serverless functions, `/*` → `index.html`
- Output directory: `dist`
- Build command: `npm run build`

## Gotchas
- Channel data is in `canales.txt` at root - changes require server restart for Express
- PPV API filtered to "Football" category only (`src/api/ppv.ts:3`)
- Embed type channels use iframe, not HLS - different playback path
- `tve-embed="true"` attribute in M3U marks channels as embed type
- TS streams require shaka-player, not hls.js (mpegts.js was removed)
- Streams in `http://` are routed through `/api/proxy?url=...` when the app runs on HTTPS (mixed content); the host allowlist lives in `shared/hlsProxy.js`
- The HLS proxy rewrites playlist URIs to `/api/proxy?url=...`; Express (`server/index.js`) and Vercel (`api/proxy.js`) share that logic
- Ecuador channels from https://iptv-org.github.io live in the `#EXTM3U-ECUADOR-IPTV-ORG` block at the end of `canales.txt` (also mirrored in `public/canales.txt`)
