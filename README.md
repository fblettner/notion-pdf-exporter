# Notion PDF Page Break Exporter

A lightweight Chrome extension that makes Notion dividers act as PDF page breaks when exporting pages.
- Version: 1.1.1
- Developer: Franck Blettner (Nomana-IT)
- Contact: https://github.com/fblettner • franck.blettner@nomana-it.fr

## ✨ Features

Notion PDF Page Break Exporter makes exporting clean PDFs from Notion easy. The extension detects divider blocks (`---`) and injects print-friendly CSS so each divider starts a new PDF page. It hides Notion UI chrome, expands content to full width, and preserves images, code blocks, and other atomic elements.

- Divider-based page breaks: Use `---` in Notion to force a new PDF page.
- Lightweight: No external servers or accounts — all work happens in your browser.
- Open source: MIT licensed. Inspect or contribute on GitHub.
- Works on public Notion pages and inside your workspace (runs only on notion.so domains).

## 📦 Install — From the Chrome Web Store

If this extension is published in the Chrome Web Store, users will install it directly from the store listing — no manual download or unpacking is required.

## 📦 Install — Unpacked / Developer mode (for testing)

If you want to load the extension locally for testing or development:

1. Download or clone this repository and unzip if needed
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this extension folder

## 🖨️ Usage

1. Open a Notion page in Chrome
2. Click the extension icon in the toolbar
3. Click **Export to PDF**
4. In the print dialog choose **Destination → Save as PDF** and Save

## Notes & Tips

- Place `---` divider blocks where you'd like page breaks.
- Best print settings: paper size A4 (or your preferred size), margins set to None, enable Background graphics for full fidelity.


## Permissions

This extension requires the following permissions (declared in `manifest.json`):

- `activeTab` — to operate on the active Notion page
- `scripting` — to inject CSS and trigger printing
- `storage` — to persist user settings

The extension only injects scripts/CSS into Notion domains as declared in `host_permissions`.

## Changelog

- 1.1.1 — Add developer metadata and README updates for publishing
- 1.1.0 — Initial public build (divider-based page breaks)

## Credits

Developed by Franck Blettner • Nomana-IT

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.
