# 🤖 LinkedVA

**AI-powered assistant for LinkedIn Virtual Assistants**

LinkedVA is a Chrome extension that helps Virtual Assistants work faster and smarter on LinkedIn. Generate on-brand replies and extract leads effortlessly using Chrome's built-in Gemini Nano AI—100% on-device, privacy-first.

---

## 🎯 Features

### 🤖 Smart Reply Generation
- **Brand-Aware Replies**: Generate 3 reply options that match your brand voice
- **Context Detection**: Automatically reads comment threads for relevant responses
- **Multi-Language Support**: Output in English, Spanish, or Japanese
- **Translation**: Convert drafts to your target language while maintaining brand voice
- **Draggable UI**: Repositionable interface that stays out of your way

### 👥 Intelligent Lead Extraction
- **AI-Powered Extraction**: Capture Name, Role, Company, and Email from any webpage
- **One-Click Capture**: Floating button for quick lead extraction
- **Lead Management**: View, organize, and manage all extracted leads
- **Export Options**: Copy to clipboard or export as CSV
- **Smart Parsing**: Works on LinkedIn profiles, company websites, and more

### 🔒 Privacy-First
- **100% On-Device Processing**: All AI runs locally using Gemini Nano
- **Zero Data Collection**: No external API calls or tracking
- **No Cloud Storage**: Everything stays on your device

---

### Prerequisites

1. **Chrome Browser** (latest stable version)
   - Make sure Chrome is fully updated
   - Go to `chrome://settings/help` to check for updates
   - Download: https://www.google.com/chrome/

2. **Enable Developer Mode**:
   - Go to `chrome://extensions`
   - Toggle **"Developer mode"** on (top right corner)

3. **Enable Optimization Guide Flag**:
   - Go to `chrome://flags`
   - Search for "optimization guide" or "Enables optimization guide on device"
   - Set **"Enables optimization guide on device"** to `Enabled BypassPerfRequirement`

4. **Enable All Gemini Nano Flags**:
   - Still in `chrome://flags`
   - Search for "gemini" or "nano" and enable ALL the following flags:
   
   | Flag | Setting |
   |------|--------|
   | **Prompt API for Gemini Nano** | `Enabled` |
   | **Prompt API for Gemini Nano with Multimodal Input** | `Enabled` |
   | **Summarization API for Gemini Nano** | `Enabled Multilingual` |
   | **Writer API for Gemini Nano** | `Enabled Multilingual` |
   | **Rewriter API for Gemini Nano** | `Enabled Multilingual` |
   | **Proofreader API for Gemini Nano** | `Enabled` |
   
   - Click **"Relaunch"** to restart Chrome

5. **Download the AI Model**:
   - Go to `chrome://components`
   - Find **"Optimization Guide On Device Model"**
   - Click **"Check for update"**
   - Wait for the model to download (may take 5-10 minutes)
   - The version should show something like: `2025.8.8.1141`

6. **Verify Model is Ready**:
   - Go to `chrome://on-device-internals/`
   - Click **"Model Status"** tab
   - Scroll down and wait until these show **"Ready"** status:
     - `OPTIMIZATION_TARGET_LANGUAGE_DETECTION`
     - `OPTIMIZATION_TARGET_TEXT_SAFETY`
   - ⚠️ **Important**: Do not proceed until both show "Ready"

---

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/linkedva.git
   cd linkedva
   ```

2. Open `chrome://extensions` in Chrome

3. Enable **Developer mode** (top right toggle)

4. Click **Load unpacked**

5. Select the `replyBot` folder

6. Pin the extension to your toolbar

---

## 📖 Setup & Usage

### Setting Up Your Brand Voice

1. Click the LinkedVA extension icon
2. Go to the **Brand Setup** tab (default)
3. Fill in your brand details:
   - **Business Name**: Your company name
   - **Tagline**: Brief tagline
   - **Description**: What your business does
   - **Tone**: How the AI should sound (e.g., professional, friendly)
   - **Core Values**: Principles that guide your brand
   - **Target Audience**: Who you're speaking to
   - **Do's**: What to include or emphasize
   - **Don'ts**: What to avoid
4. Click **Save Brand Profile**
5. Your profile is saved locally in Chrome storage

### Generating Replies

1. Navigate to any website with comments (LinkedIn, Twitter, Reddit, etc.)
2. Click on a **reply or comment field** (multi-line text areas)
3. LinkedVA pill appears in the top-right corner
4. Click the pill to open the panel
5. Click **Draft 3** to generate three reply options
6. Review options and click **Insert** to add one to the field
7. Edit as needed and post

**Dragging LinkedVA:**
- Click and drag the pill to reposition if it blocks your view
- Position persists while focused on the same field
- Resets when you focus on a different field

**Translation:**
- Type your draft in the comment field first
- Click the LinkedVA pill
- Click **Translate** to convert to your default reply language

### Extracting Leads

1. Navigate to any webpage (LinkedIn profile, company website, etc.)
2. **(Optional)** Highlight specific text containing lead information
3. Click the floating **"Extract Lead"** button (bottom-right)
4. Wait 2-5 seconds for AI extraction
5. Lead is automatically saved

### Managing Leads

1. Click the extension icon to open the popup
2. Switch to the **Leads** tab
3. View all extracted leads with details
4. **Copy Individual Lead**: Click the copy icon
5. **Export to CSV**: Click "Export CSV" to download
6. **Delete Lead**: Click trash icon
7. **Clear All**: Click "Clear All" (confirmation required)

---

## 🏗️ Technical Architecture

### Project Structure
```
linkedva/
├── manifest.json                    # Extension configuration
├── background/
│   └── service_worker.js           # Lead extraction logic & messaging
├── content/
│   ├── replyBot.js                 # Reply generation UI & logic
│   ├── replyBot.css                # ReplyBot styles
│   ├── leadExtract.js              # Lead extraction UI
│   └── leadExtract.css             # Lead extraction styles
├── popup/
│   ├── popup.html                  # Tabbed interface
│   ├── popup.css                   # Modern UI styles
│   ├── popup.js                    # Tab navigation controller
│   └── tabs/
│       ├── brandSetup.js           # Brand voice setup logic
│       └── leadManagement.js       # Lead management logic
├── assets/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── BRAND_GUIDE.md                  # Brand guidelines & design system
├── DESIGN_SYSTEM.md                # Detailed design specifications
└── README.md
```

### On-Device AI Processing
- Uses Chrome's **Gemini Nano** model via Prompt API
- All processing happens locally (zero network calls)
- Privacy-first: no data leaves your device
- Supports English, Spanish, and Japanese output

### AI Workflow
1. **Context Collection**: Extracts comment thread and recent replies
2. **Summarization**: Condenses conversation into key points
3. **Draft Generation**: Creates 3 reply options using brand voice
4. **Safety Filter**: Reviews drafts for brand compliance
5. **Multi-layer Parsing**: Handles malformed JSON with 4 fallback strategies

---

## 🔧 Troubleshooting

### "LanguageModel API unavailable"
- Verify Gemini Nano downloaded: `chrome://components`
- Check flags are enabled: `chrome://flags`
- Restart Chrome completely
- Wait 5 minutes after download completes

### LinkedVA doesn't appear
- Only triggers on **multi-line comment/reply fields**
- **Excludes**: search bars, post creation fields, single-line inputs
- **Messenger chats are intentionally excluded**
- Must have placeholder/aria-label containing "comment" or "reply" keywords

### "No safe drafts generated"
- Context might be too vague or inappropriate
- Try focusing on a specific comment thread with clear context
- Ensure brand profile is properly configured with Do's and Don'ts

### Lead Extraction Not Working
- Open DevTools Console (F12) and check for errors
- Verify page content is accessible (some sites may block content scripts)
- Try highlighting specific text and extracting again

### Poor Lead Extraction Quality
- AI works best with clearly formatted content
- Try highlighting just the relevant section
- Some pages may have too much noise/ads

---

## 🎯 Use Cases

### For Virtual Assistants
- Quickly respond to LinkedIn comments with consistent brand voice
- Extract lead information from profiles and company websites
- Maintain professionalism across multiple client accounts
- Export leads for CRM integration

### For Social Media Managers
- Generate brand-safe replies across platforms
- Capture influencer contact information
- Maintain consistent tone across conversations
- Track and organize potential partnerships

### For Sales Teams
- Extract prospect information from company websites
- Generate personalized outreach based on brand guidelines
- Organize leads with timestamps and sources
- Export to spreadsheets for pipeline management

---

## 🎨 UI/UX Highlights

- **Modern Design**: Purple gradient header with dark theme
- **Tabbed Interface**: Clean separation between Brand Setup and Lead Management
- **Smooth Animations**: Fade-in transitions and hover effects
- **Responsive Design**: Optimized popup dimensions (600px width)
- **Visual Feedback**: Status messages, loading states, and success indicators
- **Accessible**: Keyboard navigation support, semantic HTML

---

## 🔒 Privacy & Security

- ✅ All AI processing happens **on-device** using Gemini Nano
- ✅ **No external API calls** or data transmission
- ✅ Data stored locally in Chrome storage only
- ✅ No telemetry or tracking
- ✅ Open source - audit the code yourself

---

## 📊 Chrome APIs Used

- **Prompt API**: Core text generation for replies and brand voice creation
- **LanguageModel API**: Session management with custom system prompts
- **Output Language Control**: English ('en'), Spanish ('es'), Japanese ('ja')
- **Chrome Storage API**: Local data persistence
- **Chrome Runtime API**: Message passing between components
- **Content Scripts API**: Page interaction and UI injection

---

## 🎯 Known Limitations

- Chrome Canary/Dev only (experimental Prompt API)
- English, Spanish, Japanese output only
- Model quality varies by hardware capabilities
- Some complex parsing failures with heavily malformed AI output
- Requires ~1.7GB disk space for Gemini Nano model
- Extraction accuracy depends on page content structure

---

## 🔮 Future Enhancements

If Chrome ships Gemini Nano to stable:
- Chrome Web Store distribution
- Additional language support
- Multimodal input (images, audio)
- Advanced lead filtering and search
- CRM integration APIs
- Team collaboration features
- Analytics dashboard
- Custom extraction templates
- Bulk operations support

---

## 📝 Changelog

### Version 2.0.0 (Current)
- ✨ Rebranded to **LinkedVA**
- ✨ Modern UI redesign with purple gradient and dark theme
- ✨ Merged lead extraction functionality
- ✨ New tabbed interface for Brand Setup and Leads
- ✨ AI-powered lead extraction and management
- ✨ Export leads to CSV
- ✨ Unified design system
- ✨ Background service worker for lead processing
- ✨ Modular popup architecture
- 🎨 Complete UI/UX redesign with 600px popup width
- 📦 Comprehensive brand guide documentation

### Version 0.1.0
- 🎉 Initial release (ReplyBot only)
- 🤖 Brand-aware reply generation
- 🌐 Multi-language support
- 🎨 Draggable UI
- 📝 Brand voice configuration

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR for:
- Bug fixes
- Feature enhancements
- Documentation improvements
- Better extraction/generation prompts
- UI/UX improvements

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🏆 Hackathon Submission

**Challenge**: Google Chrome Built-in AI Challenge 2025
**Track**: Chrome Extensions
**Category**: Most Helpful
**Problem Solved**: Helping Virtual Assistants maintain consistent brand voice and efficiently capture leads on LinkedIn
**Unique Approach**: Unified on-device, privacy-first AI assistant combining reply generation and lead extraction

---

## 📧 Credits

Built for Virtual Assistants, social media managers, and professionals who need efficient LinkedIn tools.

---

> ⚠️ **Experimental Technology**: The Prompt API is still experimental. Expect platform changes and keep an eye on Chrome Canary release notes.

---

**Made with ❤️ using Chrome's Built-in AI**
