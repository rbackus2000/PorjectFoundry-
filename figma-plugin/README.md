# Project Foundry Figma Plugin

Imports `ui-spec.json` from Project Foundry and generates Figma frames with the design system and screen layouts.

## Setup

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Select this directory's `manifest.json`

## Usage

1. Run the plugin from **Plugins** → **Development** → **Project Foundry Importer**
2. Paste the contents of `/design/ui-spec.json` into the text area
3. Click **Import**
4. The plugin will create:
   - A "Design System" frame with color swatches and labels
   - Individual screen frames for each screen in the spec

## Development

To compile TypeScript:

```bash
npm install -g @figma/plugin-typings
tsc --watch
```

## Files

- `manifest.json` - Plugin configuration
- `code.ts` - Main plugin logic
- `ui.html` - Plugin UI

## Note

This is a minimal scaffold. Extend it to:
- Import typography styles
- Generate component variants
- Auto-layout screen components
- Import spacing tokens
