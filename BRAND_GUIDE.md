# Brand Guide
**Virtual Assistant LinkedIn Extension**

---

## 📋 Table of Contents
- [Brand Overview](#brand-overview)
- [Logo & Name](#logo--name)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Visual Identity](#visual-identity)
- [Component Styles](#component-styles)
- [Voice & Tone](#voice--tone)
- [Usage Guidelines](#usage-guidelines)

---

## 🎯 Brand Overview

### Mission
Empower virtual assistants to work smarter, faster, and more efficiently on LinkedIn through AI-powered automation and lead management.

### Target Audience
- Virtual Assistants (VAs)
- LinkedIn outreach specialists
- Social media managers
- Lead generation professionals
- Business development representatives

### Brand Personality
- **Professional** - Reliable and trustworthy
- **Efficient** - Saves time and streamlines workflows
- **Modern** - Clean, contemporary design
- **Intelligent** - AI-powered and smart
- **Supportive** - Always there to help

---

## 🏷️ Logo & Name

### Official Brand Name
**LinkedVA**

**Tagline:** "AI-powered assistant for LinkedIn Virtual Assistants"

**Rationale:**
- Clear and professional
- Immediately communicates purpose (LinkedIn + Virtual Assistant)
- Easy to remember and spell
- Perfect for target audience (VAs working on LinkedIn)
- Short and memorable (8 characters)

### Logo Elements
- **Icon**: Robot emoji (🤖) or custom icon
- **Style**: Modern, minimal, tech-forward
- **Format**: SVG for scalability
- **Variations**: Full color, monochrome, icon-only

---

## 🎨 Color Palette

### Primary Colors

#### Brand Purple Gradient
```
Primary Purple:    #667eea
Secondary Purple:  #764ba2
Gradient:         linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

**Usage:**
- Headers and navigation
- Brand accents
- Call-to-action elements
- Hover states
- Active states and indicators

**RGB Values:**
- Primary: `rgb(102, 126, 234)`
- Secondary: `rgb(118, 75, 162)`

**HSL Values:**
- Primary: `hsl(231, 76%, 66%)`
- Secondary: `hsl(270, 37%, 46%)`

---

### Action Colors

#### Success Green
```
Base:    #238636
Hover:   #2ea043
```
**Usage:** Submit buttons, success messages, positive indicators

**RGB:** `rgb(35, 134, 54)`

#### Danger Red
```
Base:    #f85149
Hover:   #ff6b6b
```
**Usage:** Delete buttons, error messages, warnings

**RGB:** `rgb(248, 81, 73)`

#### Info Blue
```
Accent:  #58a6ff
Focus:   rgba(88, 166, 255, 0.1)
```
**Usage:** Links, focus states, informational elements

**RGB:** `rgb(88, 166, 255)`

---

### Neutral Colors (Dark Theme)

#### Backgrounds
```
Primary Background:     #0d1117  (Darkest)
Secondary Background:   #161b22  (Cards, inputs)
Tertiary Background:    #21262d  (Hover states)
```

#### Text
```
Primary Text:      #f0f6fc  (White/bright)
Secondary Text:    #8b949e  (Muted/gray)
```

#### Borders
```
Default Border:    #30363d
Hover Border:      #58a6ff
```

---

### Color Usage Matrix

| Element | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Header | Purple Gradient | White | None | N/A |
| Tab Active | Dark BG | Purple | Purple | N/A |
| Tab Inactive | Transparent | Gray | None | Tertiary BG |
| Primary Button | Success Green | White | None | Brighter Green |
| Secondary Button | Tertiary BG | White | Default | Info Blue |
| Danger Button | Danger Red | White | None | Brighter Red |
| Input Field | Secondary BG | White | Default | Info Blue |
| Card | Secondary BG | White | Default | Purple |
| Success Message | Green Tint | Green | Green | N/A |
| Error Message | Red Tint | Red | Red | N/A |

---

## ✍️ Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

**Rationale:** System font stack ensures native look and optimal performance across platforms.

---

### Font Sizes

| Element | Size (rem) | Size (px) | Weight | Usage |
|---------|-----------|-----------|--------|-------|
| Hero Text | 2rem | 32px | 700 | Stat numbers |
| H1 Header | 1.3rem | 20.8px | 600 | Main header |
| H2 Heading | 1.2rem | 19.2px | 600 | Section headings |
| Tab Text | 1.1rem | 17.6px | 500 | Tab navigation |
| Body Text | 0.9rem | 14.4px | 400 | Form labels, paragraphs |
| Button Text | 0.95rem | 15.2px | 500 | All buttons |
| Small Text | 0.85rem | 13.6px | 400 | Helper text, metadata |
| Hint Text | 0.75rem | 12px | 400 | Input hints, captions |

---

### Font Weights

```css
400 - Normal     (Body text, paragraphs)
500 - Medium     (Buttons, labels, navigation)
600 - Semi-Bold  (Headings, names)
700 - Bold       (Stats, emphasis)
```

---

### Line Heights

```css
1.0 - Large numbers, stats
1.4 - Hints, small text
1.5 - Body text, descriptions
1.6 - Long-form content
```

---

## 🎭 Visual Identity

### Spacing System
Based on **4px increment** scale:

```css
--spacing-xs:  4px   (Tight spacing, badges)
--spacing-sm:  8px   (Small gaps, inline elements)
--spacing-md:  12px  (Standard gaps, card padding)
--spacing-lg:  16px  (Section padding, major gaps)
--spacing-xl:  20px  (Large spacing, header padding)
```

---

### Border Radius

```css
--radius-sm:    6px   (Inputs, small cards)
--radius-md:    8px   (Buttons, cards, containers)
--radius-pill:  999px (Fully rounded pills)
```

**Philosophy:** Soft, rounded corners create a friendly, modern appearance.

---

### Shadows

#### Elevation Levels
```css
Subtle:   0 2px 8px rgba(0, 0, 0, 0.1)
Medium:   0 4px 12px rgba(0, 0, 0, 0.15)
High:     0 6px 16px rgba(0, 0, 0, 0.2)
```

#### Colored Shadows (Interactive)
```css
Success:  0 4px 8px rgba(35, 134, 54, 0.3)
Primary:  0 4px 12px rgba(102, 126, 234, 0.4)
Danger:   0 4px 8px rgba(248, 81, 73, 0.3)
Card:     0 2px 8px rgba(102, 126, 234, 0.15)
```

**Usage:** Apply colored shadows on hover to reinforce interactivity.

---

### Icons

#### Sizing
```css
16px × 16px - Standard (buttons, inline)
18px × 18px - Tab navigation
20px × 20px - Larger actions
48px × 48px - Empty states, heroes
```

#### Style
- **Source:** Heroicons (outline variant)
- **Stroke width:** 2px
- **Line caps:** Rounded
- **Style:** Outline/stroke-based (not filled)

#### Icon Library
```html
<!-- From Heroicons -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="..." />
</svg>
```

---

## 🧩 Component Styles

### Buttons

#### Primary Button (Success Action)
```css
Background:    #238636
Text:          #ffffff
Padding:       12px 20px
Border Radius: 8px
Font Weight:   500

Hover:
  Background: #2ea043
  Transform:  translateY(-1px)
  Shadow:     0 4px 8px rgba(35, 134, 54, 0.3)
```

#### Secondary Button
```css
Background:    #21262d
Text:          #f0f6fc
Border:        1px solid #30363d
Padding:       12px 20px
Border Radius: 8px

Hover:
  Background:   #161b22
  Border Color: #58a6ff
  Transform:    translateY(-1px)
```

#### Danger Button
```css
Background:    #f85149
Text:          #ffffff
Padding:       12px 20px
Border Radius: 8px

Hover:
  Background: #ff6b6b
  Transform:  translateY(-1px)
  Shadow:     0 4px 8px rgba(248, 81, 73, 0.3)
```

---

### Form Inputs

#### Text Input / Textarea
```css
Background:    #161b22
Border:        1px solid #30363d
Border Radius: 6px
Padding:       10px
Color:         #f0f6fc

Focus:
  Border Color: #58a6ff
  Shadow:       0 0 0 2px rgba(88, 166, 255, 0.1)

Placeholder:
  Color:   #8b949e
  Opacity: 0.7
```

---

### Cards

#### Lead Card / Content Card
```css
Background:    #161b22
Border:        1px solid #30363d
Border Radius: 8px
Padding:       14px

Hover:
  Border Color: #667eea
  Shadow:       0 2px 8px rgba(102, 126, 234, 0.15)
  Transform:    translateY(-1px)
```

---

### Tab Navigation

#### Tab Button
```css
Default:
  Background: transparent
  Color:      #8b949e
  Border:     2px solid transparent (bottom)

Hover:
  Background: #21262d
  Color:      #f0f6fc

Active:
  Color:        #667eea
  Border Color: #667eea (bottom)
  Background:   #0d1117
```

---

### Header

```css
Background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Padding:    20px
Shadow:     0 2px 8px rgba(0, 0, 0, 0.1)
Border:     1px solid rgba(255, 255, 255, 0.1) (bottom)

Title:
  Font Size:   1.3rem
  Font Weight: 600
  Color:       #ffffff
  Text Shadow: 0 2px 4px rgba(0, 0, 0, 0.2)

Subtitle:
  Font Size: 0.85rem
  Color:     rgba(255, 255, 255, 0.9)
```

---

## 🎬 Animations & Transitions

### Timing Functions
```css
--transition-fast:   0.2s ease
--transition-normal: 0.3s ease
```

### Common Animations

#### Fade In (Tab Switch)
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
Duration: 0.3s
```

#### Slide In (Notifications)
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
Duration: 0.3s
```

#### Hover Lift
```css
Default:     transform: translateY(0)
Hover:       transform: translateY(-1px)
Transition:  0.2s ease
```

---

## 🗣️ Voice & Tone

### Writing Style

#### Do's ✅
- Use clear, concise language
- Be professional but friendly
- Focus on benefits and outcomes
- Use active voice
- Include helpful hints and context
- Explain technical terms when needed

#### Don'ts ❌
- Avoid jargon without explanation
- Don't be overly casual
- Avoid long, complex sentences
- Don't make assumptions about user knowledge
- Avoid excessive exclamation marks

### Example Microcopy

#### Headers
- "Brand Voice Setup" (not "Setup Your Brand")
- "Lead Management" (not "Manage Leads")

#### Buttons
- "Save Brand Profile" (clear action)
- "Export CSV" (explicit format)
- "Clear All" (straightforward)

#### Hints
- "How should the AI sound? (friendly, professional, casual, etc.)"
- "What principles guide your brand?"

#### Empty States
- "No leads yet"
- "Visit a LinkedIn profile or social media page and click 'Extract Lead' to get started"

#### Success Messages
- "Brand profile saved successfully"
- "Lead extracted and saved"

#### Error Messages
- "Unable to save brand profile. Please try again."
- "Failed to extract lead. Please refresh and try again."

---

## 📐 Usage Guidelines

### Header Usage
- Always use gradient background
- Include both title and subtitle
- Use robot emoji (🤖) or custom icon
- Maintain white text for contrast

### Button Hierarchy
1. **Primary (Green):** Main actions (Save, Submit)
2. **Secondary (Gray):** Supporting actions (Copy, Export)
3. **Danger (Red):** Destructive actions (Delete, Clear)

### Form Design
- Group related fields in fieldsets
- Always include helpful hints
- Use placeholders to show examples
- Provide clear validation messages

### Spacing Consistency
- Use 16px gaps between major sections
- Use 12px gaps between form fields
- Use 8px gaps for inline elements
- Use 4px gaps for tight spacing (badges, chips)

### Accessibility
- Maintain WCAG AA contrast ratios
- Include focus states on all interactive elements
- Support keyboard navigation
- Respect `prefers-reduced-motion`

---

## 📦 Assets & Resources

### Design Files
- `popup/popup.css` - Main stylesheet
- `DESIGN_SYSTEM.md` - Detailed design system
- `BRAND_GUIDE.md` - This document

### Icon Sources
- [Heroicons](https://heroicons.com/) - Primary icon library
- Use outline variant with 2px stroke

### Color Palette (Copy-Paste)
```css
/* Primary Colors */
--primary-color: #667eea;
--primary-hover: #5568d3;
--secondary-color: #764ba2;

/* Action Colors */
--success-color: #238636;
--success-hover: #2ea043;
--danger-color: #f85149;
--danger-hover: #ff6b6b;
--info-color: #58a6ff;

/* Neutrals */
--bg-dark: #0d1117;
--bg-secondary: #161b22;
--bg-tertiary: #21262d;
--text-primary: #f0f6fc;
--text-secondary: #8b949e;
--border-color: #30363d;
--border-hover: #58a6ff;
```

---

## 🔄 Version History

**Version 1.0** - October 21, 2025
- Initial brand guide creation
- Documented current design system
- Proposed rebrand names
- Established color palette and typography

**Version 1.1** - October 21, 2025
- Confirmed brand name: **LinkedVA**
- Updated all references to new brand name
- Finalized tagline and positioning

---

## 📞 Contact & Feedback

For questions or suggestions about the brand guidelines:
- Review design decisions in `DESIGN_SYSTEM.md`
- Check implementation in `popup/popup.css`
- Refer to component examples in `popup/popup.html`

---

**Last Updated:** October 21, 2025
**Document Version:** 1.0.0
