# 🎨 UI/UX Design Documentation

## Visual Hierarchy

### Popup Interface (600px × 600-700px)

```
┌─────────────────────────────────────────────┐
│  🤖 ReplyBot + Lead Extractor               │ ← Gradient Header
│  AI-powered assistant for replies & leads  │   Purple → Deep Purple
├─────────────────────────────────────────────┤
│ 📝 Brand Setup  |  👤 Leads                 │ ← Tab Navigation
├─────────────────────────────────────────────┤
│                                             │
│  [Active Tab Content]                       │
│                                             │
│  • Brand Setup Tab:                         │
│    - Form inputs (mission, adjectives, etc) │
│    - Generate button                        │
│    - Master prompt display                  │
│    - Export/Import actions                  │
│                                             │
│  • Leads Tab:                               │
│    - Stats counter (Total: 0)               │
│    - Action buttons (Copy, Export, Clear)   │
│    - Lead cards list                        │
│    - Empty state / Lead cards               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Color Scheme

### Primary Colors
```css
--primary-color: #667eea      /* Purple-blue gradient start */
--primary-hover: #5568d3      /* Darker on hover */
--secondary-color: #764ba2    /* Deep purple gradient end */
```

### Semantic Colors
```css
--success-color: #238636      /* Green for success states */
--success-hover: #2ea043      /* Brighter green on hover */
--danger-color: #f85149       /* Red for destructive actions */
--danger-hover: #ff6b6b       /* Brighter red on hover */
```

### Neutrals (Dark Theme)
```css
--bg-dark: #0d1117           /* Main background (GitHub dark) */
--bg-secondary: #161b22      /* Secondary surfaces */
--bg-tertiary: #21262d       /* Tertiary surfaces / hover states */
--text-primary: #f0f6fc      /* Primary text */
--text-secondary: #8b949e    /* Secondary/muted text */
--border-color: #30363d      /* Default borders */
--border-hover: #58a6ff      /* Focus/active state */
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

### Size Scale
```css
0.75rem (12px)  → Small labels, hints, metadata
0.85rem (13.6px) → Secondary text, info rows
0.9rem (14.4px)  → Body text, form inputs
0.95rem (15.2px) → Button text
1rem (16px)      → Default, lead names
1.1rem (17.6px)  → Tab headers
1.2rem (19.2px)  → Section headings
1.3rem (20.8px)  → Main header
2rem (32px)      → Stat numbers
```

### Weight Scale
```css
400 → Normal text
500 → Medium weight (buttons, labels)
600 → Semi-bold (names, headings)
700 → Bold (stat numbers)
```

---

## Component Styles

### Buttons

#### Primary Button (Success)
```css
background: #238636
color: white
padding: 12px 20px
border-radius: 8px
font-weight: 500

hover:
  background: #2ea043
  transform: translateY(-1px)
  box-shadow: 0 4px 8px rgba(35, 134, 54, 0.3)
```

#### Secondary Button
```css
background: #21262d
color: #f0f6fc
border: 1px solid #30363d
padding: 10px 12px
border-radius: 8px

hover:
  background: #161b22
  border-color: #58a6ff
```

#### Danger Button
```css
background: #f85149
color: white
padding: 10px 12px
border-radius: 8px

hover:
  background: #ff6b6b
```

### Form Inputs

#### Text Input / Textarea
```css
background: #161b22
border: 1px solid #30363d
border-radius: 6px
padding: 10px
color: #f0f6fc

focus:
  border-color: #58a6ff
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.1)
```

### Cards

#### Lead Card
```css
background: #161b22
border: 1px solid #30363d
border-radius: 8px
padding: 14px

hover:
  border-color: #667eea
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15)
```

---

## On-Page Elements

### ReplyBot Pill (Floating)
```
Position: Top-right of viewport
Size: Auto width × ~40px height
Background: #238636 (green)
Border-radius: 999px (fully rounded)
Shadow: 0 2px 8px rgba(0, 0, 0, 0.2)
Z-index: 2147483647 (max)

States:
- Default: Green with "ReplyBot" text
- Hover: Slightly elevated
- Dragging: cursor: grabbing
```

### ReplyBot Panel
```
Position: Below pill (when open)
Size: ~320px × auto
Background: #161b22
Border: 1px solid #30363d
Border-radius: 8px
Shadow: 0 4px 16px rgba(0, 0, 0, 0.3)

Contains:
- Warning message (if no brand profile)
- Chip buttons (Draft, Translate)
- Results area (3 draft options)
- Insert buttons
```

### Lead Extract Button (Floating)
```
Position: Bottom-right of viewport
Size: Auto width × ~44px height
Background: Linear gradient (purple to deep purple)
Border-radius: 50px (pill shape)
Shadow: 0 4px 12px rgba(102, 126, 234, 0.4)
Z-index: 999999

States:
- Default: Purple gradient
- Hover: Scale 1.05, elevated shadow
- Loading: Pink gradient, spinning icon
- Success: Blue gradient, checkmark icon
```

---

## Animations

### Tab Switch
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

duration: 0.3s
easing: ease
```

### Button Hover
```css
transition: all 0.2s ease

hover:
  transform: translateY(-1px)
  box-shadow: enhanced
```

### Spin (Loading)
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

duration: 1s
timing: linear
iteration: infinite
```

### Notification Slide
```css
initial:
  opacity: 0
  transform: translateY(-20px)

show:
  opacity: 1
  transform: translateY(0)

duration: 0.3s
easing: ease
```

---

## Layout Patterns

### Flex Column (Forms, Lists)
```css
display: flex
flex-direction: column
gap: 12-16px
```

### Flex Row (Actions, Stats)
```css
display: flex
gap: 8-10px
align-items: center
justify-content: space-between
```

### Grid (Future - Settings)
```css
display: grid
grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
gap: 12px
```

---

## Spacing System

### Padding Scale
```
4px  → Tight spacing (chip badges)
6px  → Icon buttons
8px  → Small elements
10px → Input fields, buttons
12px → Card padding, form gaps
14px → Section padding
16px → Standard spacing
20px → Large spacing
```

### Margin Scale (similar to padding)
```
margin-bottom: 8px  → Element separation
margin-bottom: 12px → Section headers
margin-bottom: 16px → Major sections
margin-top: 20px    → Section dividers
```

### Gap Scale (Flexbox)
```
gap: 6px   → Inline elements (icon + text)
gap: 8px   → Button groups
gap: 10px  → Action bars
gap: 12px  → Form fields
gap: 14px  → Card lists
gap: 16px  → Major sections
```

---

## Shadows

### Elevation 1 (Subtle)
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
/* Headers, cards at rest */
```

### Elevation 2 (Medium)
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
/* Floating buttons, modals */
```

### Elevation 3 (High)
```css
box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2)
/* Dragging elements, focus states */
```

### Colored Shadows (Hover)
```css
/* Success button */
box-shadow: 0 4px 8px rgba(35, 134, 54, 0.3)

/* Primary button */
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4)

/* Lead card hover */
box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15)
```

---

## Border Radius

```css
4px  → Small elements
6px  → Input fields, icon buttons
8px  → Cards, buttons, containers
50px → Pill buttons (lead extract)
999px → Fully rounded pills (ReplyBot)
```

---

## Z-Index Hierarchy

```css
1     → Default layer
999   → Popup content
9999  → Modals, dialogs
999999 → Lead extract button
1000000 → Lead extract notifications
2147483647 → ReplyBot (max z-index)
```

---

## Responsive Breakpoints

### Popup (Fixed Width)
```css
width: 600px
min-height: 600px
max-height: 700px
```

### Small Screens (< 600px)
```css
@media (max-width: 600px) {
  width: 100%
  actions-bar: flex-direction: column
}
```

---

## Accessibility

### Focus States
```css
:focus {
  outline: none
  border-color: #58a6ff
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.1)
}
```

### Hover States
- All interactive elements have hover states
- Color changes or elevation changes
- Cursor changes (pointer, move, grab)

### Keyboard Navigation
- Tab through form fields
- Tab through buttons
- Enter to submit forms
- Space to activate buttons

---

## Icons

### Icon Sizing
```css
16px × 16px → Standard icons (buttons, tabs)
20px × 20px → Larger icons (extract button)
24px × 24px → Hero icons
48px × 48px → Empty state icons
```

### Icon Style
- Stroke-based (not filled)
- 2px stroke width
- Rounded line caps
- Consistent visual weight

---

## Empty States

### Lead List Empty State
```
[Large Icon - 48px]
    64px height
    
"No leads extracted yet"
    Bold, 1rem, white
    
"Visit any webpage and click 'Extract Lead' button"
    0.85rem, gray, hint text
```

---

## State Indicators

### Loading
- Spinner animation
- "Generating..." / "Extracting..." text
- Disabled interaction
- Color change (purple → pink)

### Success
- Checkmark icon
- "Extracted!" / "Saved!" text
- Color change (purple → blue)
- Auto-dismiss after 2 seconds

### Error
- Red border/background
- Error message text
- Dismiss button
- Stays visible until dismissed

---

## Best Practices Applied

1. **Consistent spacing** using 4px scale
2. **Color semantics** (green = success, red = danger, purple = brand)
3. **Visual hierarchy** through size, weight, color
4. **Feedback on interaction** (hover, active, loading states)
5. **Smooth transitions** (0.2-0.3s for most animations)
6. **Elevated on hover** (translateY and shadow)
7. **Rounded corners** for modern look
8. **Dark theme** for reduced eye strain
9. **High contrast** for readability
10. **Icon + text** for clarity

---

**Design System Version**: 2.0.0  
**Last Updated**: October 21, 2025  
**Platform**: Chrome Extension (Manifest V3)
