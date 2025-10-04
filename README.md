# ReplyBot Chrome Extension

ReplyBot is a Chrome extension for the **Google Chrome Built-in AI Challenge 2025** that uses Gemini Nano's on-device AI to generate brand-aware replies across any website.

## Prerequisites

### 1. Chrome Setup
- **Required**: Chrome Canary or Dev channel (version 131+)
- Download: [Chrome Canary](https://www.google.com/chrome/canary/)

### 2. Enable Required Flags
Navigate to `chrome://flags` and enable:
- `#prompt-api-for-gemini-nano` → **Enabled**
- `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

**Important**: After enabling flags, restart Chrome completely.

### 3. Download Gemini Nano Model
1. Go to `chrome://components`
2. Find "Optimization Guide On Device Model"
3. Click "Check for update" to download (~1.7GB)
4. Wait for status to show "Up to date"

### 4. Verify Installation
1. Open DevTools Console (F12) on any page
2. Type: `await LanguageModel.capabilities()`
3. Should return: `{available: "readily"}`

If you see `{available: "after-download"}`, wait a few minutes and check again.

## Installation

1. Clone this repository
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `replyBot` folder
6. Pin the extension to your toolbar

## Setup Your Brand Profile

1. Click the ReplyBot extension icon
2. Fill in your brand details:
   - **Brand mission**: What you're trying to achieve
   - **Three adjectives**: Describing your tone (comma-separated)
   - **Do's**: Tone, phrases, or guardrails to follow
   - **Don'ts**: Topics or language to avoid
   - **(Optional)** Brand fact/tagline to weave into replies
   - **(Optional)** Sample replies for reference
   - **Default reply language**: English, Spanish, or Japanese
3. Click **Generate brand voice**
4. Wait 10-20 seconds for AI to create your brand voice profile
5. Your profile is saved locally in `chrome.storage`

## Usage

### Generating Replies

1. Navigate to any website with comments (LinkedIn, Twitter, Reddit, Facebook, etc.)
2. Click on a **reply or comment field** (multi-line text areas)
3. ReplyBot pill appears in the top-right corner of your screen
4. Click the pill to open the panel
5. Click **Draft 3** to generate three reply options based on the comment context
6. Review the three options and click **Insert** to add one to the field
7. Edit as needed and post

### Dragging ReplyBot
- The ReplyBot pill is **draggable**
- Click and drag to reposition if it blocks your view
- Position persists while focused on the same field
- Position resets when you focus on a different field

### Translation Feature
- Type your draft in the comment field first
- Click the ReplyBot pill
- Click **Translate** to convert to your default reply language
- Maintains your brand voice during translation

## Technical Architecture

### On-Device AI Processing
- Uses Chrome's **Gemini Nano** model via Prompt API
- All processing happens locally (zero network calls)
- **Privacy-first**: no data leaves your device
- Supports English, Spanish, and Japanese output languages

### Key Components
- **Content Script** (`contentScript.js`): Detects reply fields, injects draggable UI, manages AI sessions
- **Popup** (`popup.html`/`popup.js`): Brand profile configuration and management
- **Chrome Storage**: Local storage of brand voice (no cloud sync)
- **Smart Detection**: Only triggers on comment/reply fields, excludes search bars and post creation

### AI Workflow
1. **Context Collection**: Extracts comment thread and recent replies
2. **Summarization**: Condenses conversation into key points
3. **Draft Generation**: Creates 3 reply options using brand voice
4. **Safety Filter**: Reviews drafts for brand compliance
5. **Multi-layer Parsing**: Handles malformed JSON with 4 fallback strategies

## Troubleshooting

### "LanguageModel API unavailable"
- Verify Gemini Nano downloaded: `chrome://components`
- Check flags are enabled: `chrome://flags`
- Restart Chrome completely
- Wait 5 minutes after download completes

### "No output language was specified" warning
- This is expected - extension explicitly sets output language
- Check console logs with the debug version
- Should see: `Creating session with config: { outputLanguage: 'en', ... }`

### ReplyBot doesn't appear
- Only triggers on **multi-line comment/reply fields**
- **Excludes**: search bars, post creation fields, single-line inputs, document titles
- **Messenger chats are intentionally excluded** (Facebook Messenger, messenger.com)
- Must have placeholder/aria-label containing "comment" or "reply" keywords

### "No safe drafts generated"
- Context might be too vague or inappropriate
- Try focusing on a specific comment thread with clear context
- Ensure brand profile is properly configured with Do's and Don'ts

### Dragging toggles the panel
- Fixed: Dragging no longer triggers panel toggle
- Only clicking (without dragging) opens/closes the panel

### Model returns malformed JSON
- Known Gemini Nano limitation
- Extension has **4-layer fallback parsing**:
  1. Standard JSON.parse
  2. Regex extraction of drafts array
  3. Delimiter split with cleanup
  4. Last resort single draft return
- Retry generation if all parsing attempts fail

## APIs Used

This extension uses the following Chrome Built-in AI APIs:

- **Prompt API**: Core text generation for replies and brand voice creation
- **LanguageModel API**: Session management with custom system prompts
- **Output Language Control**: English ('en'), Spanish ('es'), Japanese ('ja')

## Hackathon Submission Details

**Challenge**: Google Chrome Built-in AI Challenge 2025  
**Track**: Chrome Extensions  
**Category**: Most Helpful  
**Problem Solved**: Maintaining consistent brand voice across fragmented online communications  
**Unique Approach**: On-device, privacy-first AI writing assistant that works universally across all websites with smart field detection

## Features

✅ **Smart Content Detection**: Only appears on relevant comment/reply fields  
✅ **Drag-and-Drop UI**: Repositionable interface that doesn't obstruct content  
✅ **Context-Aware**: Reads conversation threads for relevant replies  
✅ **Multi-Language**: English, Spanish, Japanese output with translation  
✅ **Brand Voice Learning**: Generates consistent tone from simple inputs  
✅ **Safety Filtering**: Reviews drafts for brand compliance  
✅ **Robust Parsing**: Handles AI model inconsistencies gracefully  
✅ **Privacy-First**: 100% on-device processing, zero data collection

## Known Limitations

- Chrome Canary/Dev only (experimental Prompt API)
- English, Spanish, Japanese output only
- Model quality varies by hardware capabilities
- Some complex parsing failures with heavily malformed AI output
- Requires ~1.7GB disk space for Gemini Nano model

## Future Enhancements

If Chrome ships Gemini Nano to stable:
- Chrome Web Store distribution
- Additional language support
- Multimodal input (images, audio)
- Hybrid AI with cloud fallback for complex queries
- Platform-specific UI optimizations
- Improved context extraction algorithms

## License

MIT License - See LICENSE file

## Contributing

This is a hackathon submission project. Feedback and suggestions welcome via issues!

---

> ⚠️ **Experimental Technology**: The Prompt API is still experimental. Expect platform changes and keep an eye on Chrome Canary release notes.
