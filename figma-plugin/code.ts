/**
 * Project Foundry Figma Plugin
 * Imports ui-spec.json and generates Figma frames
 */

// Show the UI
figma.showUI(__html__, { width: 400, height: 500 });

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "import-ui-spec") {
    try {
      const uiSpec = JSON.parse(msg.uiSpecJson);
      await importUISpec(uiSpec);
      figma.notify("UI Spec imported successfully!");
    } catch (error) {
      figma.notify(`Error: ${error.message}`, { error: true });
    }
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

/**
 * Import UI Spec and create Figma frames
 */
async function importUISpec(uiSpec: any) {
  const page = figma.currentPage;

  // Create a parent frame for the design system
  const designSystemFrame = figma.createFrame();
  designSystemFrame.name = "Design System";
  designSystemFrame.resize(1200, 2000);
  designSystemFrame.x = 0;
  designSystemFrame.y = 0;
  page.appendChild(designSystemFrame);

  // Import Colors
  let yOffset = 50;
  const colorLabel = figma.createText();
  await figma.loadFontAsync(colorLabel.fontName as FontName);
  colorLabel.characters = "Colors";
  colorLabel.fontSize = 24;
  colorLabel.x = 50;
  colorLabel.y = yOffset;
  designSystemFrame.appendChild(colorLabel);
  yOffset += 50;

  for (const color of uiSpec.designSystem.colors) {
    const colorRect = figma.createRectangle();
    colorRect.resize(100, 100);
    colorRect.x = 50;
    colorRect.y = yOffset;
    colorRect.fills = [{ type: "SOLID", color: hexToRgb(color.hex) }];
    designSystemFrame.appendChild(colorRect);

    const colorText = figma.createText();
    await figma.loadFontAsync(colorText.fontName as FontName);
    colorText.characters = `${color.name}\n${color.hex}`;
    colorText.fontSize = 14;
    colorText.x = 160;
    colorText.y = yOffset + 30;
    designSystemFrame.appendChild(colorText);

    yOffset += 120;
  }

  // Create screen frames
  let screenXOffset = 1300;
  for (const screen of uiSpec.screens) {
    const screenFrame = figma.createFrame();
    screenFrame.name = screen.name;
    screenFrame.resize(375, 667); // iPhone size as default
    screenFrame.x = screenXOffset;
    screenFrame.y = 0;
    page.appendChild(screenFrame);

    // Add screen label
    const screenLabel = figma.createText();
    await figma.loadFontAsync(screenLabel.fontName as FontName);
    screenLabel.characters = `${screen.name}\n${screen.path}`;
    screenLabel.fontSize = 16;
    screenLabel.x = 20;
    screenLabel.y = 20;
    screenFrame.appendChild(screenLabel);

    screenXOffset += 400;
  }

  // Zoom to fit
  figma.viewport.scrollAndZoomIntoView([designSystemFrame]);
}

/**
 * Convert hex color to RGB (0-1 range)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}
