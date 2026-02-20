# Manga Studio Screenshots

This utility captures automated screenshots of the Manga Studio Playground for documentation and testing.

## Setup

1. Install dependencies:
   ```bash
   npm install puppeteer
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run the screenshot capture:
   ```bash
   npm run screenshots
   ```

## What It Captures

The script captures the following workflow:

1. **Initial View** - Empty canvas state
2. **Panel Added** - After clicking "+ Add Panel"
3. **Bubble Added** - After adding a speech bubble
4. **Full Page View** - Switched to full page mode
5. **Timeline Visible** - Timeline panel shown
6. **AI Manga Tab** - AI generation interface
7. **Panel Templates** - Quick template options
8. **Bubble Presets** - Bubble library and presets

## Output

Screenshots are saved to the `screenshots/` directory with numbered filenames:
- `01-initial-view.png`
- `02-panel-added.png`
- `03-bubble-added.png`
- `04-fullpage-view.png`
- `05-timeline-visible.png`
- `06-ai-manga-tab.png`
- `07-panel-templates.png`
- `08-bubble-presets.png`

## Requirements

- Node.js
- Puppeteer (automatically installed)
- Development server running on `http://localhost:3000`

## Notes

- The script runs in non-headless mode so you can see the automation
- Full page screenshots capture the entire viewport
- Each screenshot includes a 500ms wait for animations to complete
- Screenshots are captured at 1920x1080 resolution
