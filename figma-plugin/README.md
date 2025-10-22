# Project Foundry Figma Plugin

Minimal but functional Figma plugin that imports UI specifications and creates frames on the canvas.

## Installation

1. Open Figma Desktop App
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Navigate to `/figma-plugin/` and select `manifest.json`
4. The plugin will now appear in your Plugins menu

## Usage

1. In Figma, run **Plugins** → **Project Foundry UI Importer** → **Import UI Spec**
2. A dialog will open
3. Paste the contents of `/design/ui-spec.json` into the textarea
4. Click **Import**
5. Frames and nodes will appear on a new page called "Project Foundry UI"

## UI Spec Format

The plugin expects JSON with this structure:

```json
{
  "frames": [
    {
      "name": "Dashboard",
      "width": 1200,
      "height": 800,
      "nodes": [
        { "type": "text", "x": 40, "y": 40, "text": "Project Foundry", "fontSize": 24 },
        { "type": "rect", "x": 40, "y": 100, "width": 280, "height": 120, "fill": "#ffffff", "stroke": "#e5e7eb" }
      ]
    }
  ]
}
```

### Supported Node Types

- **text**: Creates a text layer
  - Props: `x`, `y`, `text`, `fontSize`
- **rect**: Creates a rectangle
  - Props: `x`, `y`, `width`, `height`, `fill` (hex), `stroke` (hex)

## Files

- `manifest.json` - Plugin manifest (Figma API v1.0.0)
- `code.ts` - Main plugin logic (~65 lines)
- `ui.html` - Import dialog UI (~30 lines)

## Development

The plugin requires no build step or dependencies. Figma compiles TypeScript automatically.

To modify:
1. Edit `code.ts` or `ui.html`
2. In Figma, go to **Plugins** → **Development** → **Reload plugin**
3. Re-run the plugin to test changes

## Troubleshooting

- **"Import failed — check JSON"**: Ensure your JSON is valid and matches the spec format
- **No frames appear**: Check the Figma console (Plugins → Development → Open Console) for errors
- **Font errors**: The plugin uses Inter Regular. If unavailable, text may not render correctly
