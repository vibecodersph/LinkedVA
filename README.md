# ReplyBot Chrome Extension

ReplyBot is an experimental Chrome extension that showcases Chrome's on-device AI APIs for drafting brand-aware replies. It bundles a popup to capture a lightweight brand voice and a content script assistant that sits next to any reply box.

## Prerequisites

- Chrome Canary or Dev channel with on-device AI support.
- Enable the required flags:
  - `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
- Verify on-device model availability via `chrome://on-device-internals`.
- Review the latest setup guidance in the Chrome AI docs: https://developer.chrome.com/docs/ai/get-started

## Install (Unpacked)

1. Clone this repo or copy the `replyBot` folder to your machine.
2. Open `chrome://extensions` and toggle on **Developer mode**.
3. Click **Load unpacked** and select the `replyBot` directory.
4. Pin the extension and open the popup to fill in your brand details.

## Usage

- While browsing, focus any text area or rich editor. A ReplyBot pill appears next to it.
- Use **Draft 3** for brand-aligned response options or **Translate** to adapt your current draft.
- Update your brand voice anytime via the popup; data stays in local `chrome.storage`.

> ⚠️ The Prompt API is still experimental. Expect platform changes and keep an eye on the Canary release notes.
