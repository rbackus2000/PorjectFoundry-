// Project Foundry UI Importer - Figma Plugin
// Imports UI specifications and creates frames/nodes on canvas

figma.on("run", ({ command }) => {
  if (command === "import-ui-spec") {
    figma.showUI(__html__, { width: 420, height: 420 });
  }
});

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "import") return;
  
  try {
    const spec = JSON.parse(msg.payload);
    const page = figma.createPage();
    page.name = "Project Foundry UI";
    figma.currentPage = page;

    for (const f of spec.frames ?? []) {
      const frame = figma.createFrame();
      frame.name = f.name ?? "Frame";
      frame.resizeWithoutConstraints(f.width ?? 1200, f.height ?? 800);
      frame.x = 100 * (spec.frames.indexOf(f) % 3);
      frame.y = 900 * Math.floor(spec.frames.indexOf(f) / 3);
      page.appendChild(frame);

      for (const n of f.nodes ?? []) {
        if (n.type === "text") {
          const t = figma.createText();
          await figma.loadFontAsync({ family: "Inter", style: "Regular" }).catch(()=>{});
          t.characters = n.text ?? "";
          t.fontSize = n.fontSize ?? 16;
          t.x = n.x ?? 0; 
          t.y = n.y ?? 0;
          frame.appendChild(t);
        } else if (n.type === "rect") {
          const r = figma.createRectangle();
          r.resizeWithoutConstraints(n.width ?? 100, n.height ?? 60);
          r.x = n.x ?? 0; 
          r.y = n.y ?? 0;
          if (n.fill) r.fills = [{ type: "SOLID", color: hexToRgb(n.fill) }];
          if (n.stroke) { 
            r.strokes = [{ type: "SOLID", color: hexToRgb(n.stroke) }]; 
            r.strokeWeight = 1; 
          }
          frame.appendChild(r);
        }
      }
    }

    figma.notify("Imported UI spec");
    figma.ui.postMessage({ type: "done" });
  } catch (e) {
    figma.notify("Import failed — check JSON");
    figma.ui.postMessage({ type: "error", message: String(e) });
  }
};

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0,2),16) / 255;
  const g = parseInt(h.substring(2,4),16) / 255;
  const b = parseInt(h.substring(4,6),16) / 255;
  return { r, g, b };
}
