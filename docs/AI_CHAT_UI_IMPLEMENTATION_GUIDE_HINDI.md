# 🎨 AI Chat UI - Complete Implementation Guide (Hindi)

**Claude/Apo Style Conversational Interface**

---

## 📋 एक लाइन में Summary

"एक clean, minimal conversational UI बनाना है जिसमें left side में collapsible sidebar हो, center में empty-state hero हो, और एक floating rounded message input card हो जो streaming responses, attachments और agent/model selector को support करे — बिल्कुल Claude/Apo screenshot जैसा दिखे।"

---

## 🏗️ Page Layout और Sizing (पूरा Structure)

### Overall Viewport
- **Height**: `100vh` (full screen height)
- **Layout**: Fixed left sidebar + Flexible main panel
- **Background**: Warm ivory `#FBF8F4`

### Left Sidebar Dimensions
| State | Width |
|-------|-------|
| Open | `300px` |
| Collapsed | `72px` |
| Background | `#F7F4F1` (slightly darker ivory) |

### Main Content Area
- **Background**: Same as page `#FBF8F4`
- **Center Container**: Horizontally centered
- **Empty State**: Hero area with generous whitespace

### Message Input Card (Desktop)
| Property | Value |
|----------|-------|
| Width | `680px - 760px` (centered) |
| Height | Auto (grows with content) |
| Position | Centered vertically on empty state |
| Border Radius | `16px` (rounded-2xl) |
| Padding | `20px - 24px` |
| Background | `#FFFFFF` (pure white) |
| Shadow | `rgba(30,30,30,0.06)` blur `24px` |

---

## 🎨 Visual Design Tokens (Exact Colors & Values)

### Colors Palette
```
Page Background:     #FBF8F4  (warm ivory)
Sidebar Background:  #F7F4F1  (slightly darker ivory)
Card Background:     #FFFFFF  (pure white)
Accent/Peach:        #EECFC1  (soft peach)
Primary Text:        #0F172A  (near-black)
Muted Text:          #6B6B6B  (grey)
Secondary Muted:     #8B8B8B  (lighter grey)
Borders:             #ECE7E3  (very subtle)
Shadow:              rgba(15, 23, 42, 0.06)
Model Pill BG:       #F3E9E3  (peach tint)
```

### Border Radius Scale
```
Small:   8px   (rounded-md)
Medium:  12px  (rounded-lg)
Large:   16px  (rounded-xl)
Pill:    9999px (rounded-full)
```

### Shadow Definitions
```css
Card Shadow:    0 4px 24px rgba(15, 23, 42, 0.06)
Dropdown:       0 8px 32px rgba(15, 23, 42, 0.12)
Button Hover:   0 2px 8px rgba(15, 23, 42, 0.08)
```

### Spacing Scale (Base Unit = 8px)
```
4px   = 0.5 unit
8px   = 1 unit
12px  = 1.5 units
16px  = 2 units
24px  = 3 units
32px  = 4 units
48px  = 6 units
64px  = 8 units
```


---

## 📝 Typography (Fonts & Sizes)

### Font Families
```
Hero/Headlines:  "Playfair Display" या "Georgia" (serif)
UI/Body:         "Inter" (sans-serif)
Code:            "JetBrains Mono" या "Fira Code" (monospace)
```

### Font Sizes
| Element | Size | Weight | Letter Spacing |
|---------|------|--------|----------------|
| Hero Headline | `36px - 42px` | 500-600 | `0.02em` |
| Subheading | `18px - 20px` | 400 | normal |
| Body Text | `16px` | 400 | normal |
| Input Placeholder | `15px - 16px` | 400 | normal |
| Sidebar Items | `14px - 15px` | 500 (active), 400 (normal) |
| Small/Caption | `12px - 13px` | 400 | normal |
| Model Pill | `13px` | 500 | normal |

---

## 🧩 Component Inventory (सभी Components की List)

### 1️⃣ Left Sidebar (`Sidebar` Component)

#### Structure
```
┌─────────────────────────┐
│ 🏠 Logo + Title         │  ← Top section
├─────────────────────────┤
│ ➕ New Chat Button      │
├─────────────────────────┤
│ 💬 Chats                │
│ 📁 Projects             │  ← Navigation items
│ 🎨 Artifacts            │
│ 💻 Code                 │
├─────────────────────────┤
│ 📋 Recents              │  ← Scrollable list
│   • Conversation 1      │
│   • Conversation 2      │
│   • ...                 │
├─────────────────────────┤
│ 👤 User Profile         │  ← Footer
└─────────────────────────┘
```

#### Visual Specs
| Property | Value |
|----------|-------|
| Background | `#F7F4F1` |
| Width (open) | `300px` |
| Width (collapsed) | `72px` |
| Item Height | `48px` |
| Item Padding Left | `16px` |
| Icon Size | `20px` |
| Divider Color | `#ECE7E3` |
| Active Item BG | `#EDE9E5` |
| Active Left Bar | `4px` width, accent color |

#### States
- **Normal**: Default background
- **Hover**: Background `+3-4%` lighter, cursor pointer
- **Active**: Darker background + left accent bar
- **Collapsed**: Only icons visible, tooltips on hover

---

### 2️⃣ Empty State Hero (`Hero` Component)

#### Structure
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│      "Coffee and Claude time?"          │  ← Serif headline
│                                         │
│    ┌─────────────────────────────┐      │
│    │ How can I help you today?  │      │  ← Input card
│    │                      [Sonnet]│      │
│    │  [+] [🔗] [⏰]         [→]  │      │
│    └─────────────────────────────┘      │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### Visual Specs
| Property | Value |
|----------|-------|
| Headline Font | Serif (Playfair/Georgia) |
| Headline Size | `36px - 42px` |
| Headline Color | `#0F172A` |
| Headline Weight | `500 - 600` |
| Card Width | `680px - 760px` |
| Card Padding | `20px - 24px` |
| Card Border Radius | `16px` |
| Card Shadow | `0 4px 24px rgba(15,23,42,0.06)` |
| Vertical Position | Centered in viewport |

---

### 3️⃣ Message Input Card (`MessageComposer` Component)

#### Structure
```
┌──────────────────────────────────────────────────┐
│ [Attached files chips - if any]                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Type your message here...          [Sonnet 4.5]│
│                                                  │
├──────────────────────────────────────────────────┤
│  [+] [🔗] [⏰]                              [→]  │
└──────────────────────────────────────────────────┘
```

#### Visual Specs
| Element | Specs |
|---------|-------|
| Textarea | Auto-grow 1-6 lines, `16px` font |
| Placeholder | `#8B8B8B`, "How can I help you today?" |
| Icon Buttons | `36px × 36px`, circular |
| Icon Button Border | `1px solid #ECE7E3` |
| Send Button | Square with rounded corners, arrow icon |
| Model Pill | Right aligned, `#F3E9E3` background |

#### Textarea Behavior
- **Enter**: Send message
- **Shift + Enter**: New line
- **Auto-grow**: 1 line to max 6 lines
- **Max Height**: ~150px then scroll

---

### 4️⃣ Model/Agent Selector (`ModelPicker` Component)

#### Structure
```
┌─────────────────┐
│ Sonnet 4.5  ▼  │  ← Pill button
└─────────────────┘
        │
        ▼ (on click)
┌─────────────────────────────────┐
│ ✓ Claude Sonnet 4.5            │
│   Fast, balanced responses      │
├─────────────────────────────────┤
│   Claude Opus 4                 │
│   Most capable, thoughtful      │
├─────────────────────────────────┤
│   Claude Haiku 3.5              │
│   Quick, efficient              │
└─────────────────────────────────┘
```

#### Visual Specs
| Property | Value |
|----------|-------|
| Pill Background | `#F3E9E3` |
| Pill Border Radius | `9999px` (full) |
| Pill Font Size | `13px` |
| Pill Padding | `8px 12px` |
| Dropdown Width | `280px` |
| Dropdown Item Height | `44px` |
| Dropdown Border Radius | `12px` |
| Selected Check | Accent color checkmark |


---

### 5️⃣ Conversations List (`ConversationList` Component)

#### Structure
```
┌─────────────────────────────────┐
│ Recents                         │  ← Section heading
├─────────────────────────────────┤
│ 📄 Coffee and Claude time?      │
│    2 hours ago                  │
├─────────────────────────────────┤
│ 📄 Help with React code         │
│    Yesterday                    │
├─────────────────────────────────┤
│ 📄 API design discussion    ⋮   │  ← Three-dot menu on hover
│    2 days ago                   │
└─────────────────────────────────┘
```

#### Visual Specs
| Property | Value |
|----------|-------|
| Section Heading | `12px`, uppercase, `#8B8B8B` |
| Item Height | `56px - 64px` |
| Title Font | `14px`, `#0F172A` |
| Timestamp | `12px`, `#8B8B8B` |
| Hover Background | `#EDE9E5` |
| Three-dot Menu | Show on hover, `20px` icon |

#### Three-dot Menu Actions
- Rename
- Duplicate
- Delete
- Pin to top

---

### 6️⃣ Chat Window (`ChatWindow` Component)

#### Structure (जब conversation exist करे)
```
┌─────────────────────────────────────────────────┐
│ [Agent Name]  🟢 Live  [Model ▼]  [⬇] [⚙]      │  ← Header
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │ 🤖 AI Response bubble               │        │
│  │    Message content here...          │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│        ┌─────────────────────────────────────┐  │
│        │ 👤 User message bubble              │  │
│        │    User's question here...          │  │
│        └─────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │ 🤖 AI Response with code...         │        │
│  │    ```javascript                    │        │
│  │    const x = 1;              [Copy] │        │
│  │    ```                              │        │
│  └─────────────────────────────────────┘        │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Message Composer - sticky bottom]              │
└─────────────────────────────────────────────────┘
```

#### Message Bubbles Specs
| Property | AI Bubble | User Bubble |
|----------|-----------|-------------|
| Background | `#F5F5F5` | `#E8E4E0` |
| Alignment | Left | Right |
| Max Width | `680px` | `680px` |
| Border Radius | `16px` | `16px` |
| Padding | `16px` | `16px` |
| Avatar | Left side, `32px` | None or right |

#### Code Block Specs
| Property | Value |
|----------|-------|
| Background | `#1E1E1E` (dark) |
| Text Color | Syntax highlighted |
| Border Radius | `8px` |
| Copy Button | Top-right, `24px` |
| Font | Monospace, `14px` |
| Padding | `16px` |

---

### 7️⃣ Streaming Controls (`StreamControls` Component)

#### During Streaming
```
┌─────────────────────────────────────┐
│ 🤖 AI is typing...                  │
│    Partial response appearing...    │
│    █ (cursor blinking)              │
│                                     │
│    [⏹ Stop generating]              │
└─────────────────────────────────────┘
```

#### After Completion
```
┌─────────────────────────────────────┐
│ 🤖 Complete response here...        │
│                                     │
│    [🔄 Regenerate] [📋 Copy]        │
│    128 tokens • Sonnet 4.5          │
└─────────────────────────────────────┘
```

#### Visual Specs
| Element | Specs |
|---------|-------|
| Stop Button | Red background `#EF4444`, white icon |
| Regenerate Button | Ghost style, `#6B6B6B` |
| Token Count | `12px`, `#8B8B8B` |
| Typing Cursor | Blinking `|`, 500ms interval |

---

### 8️⃣ User Profile Dropdown (`ProfileDropdown` Component)

#### Structure
```
┌─────────────────────────────┐
│ 👤 user@email.com       ▼  │  ← Trigger
└─────────────────────────────┘
              │
              ▼ (on click)
┌─────────────────────────────┐
│ ⚙️  Settings                │
│ 🌐  Language                │
│ ❓  Help & Support          │
├─────────────────────────────┤
│ ⭐  Upgrade to Pro          │
├─────────────────────────────┤
│ 🚪  Log out                 │
└─────────────────────────────┘
```

#### Visual Specs
| Property | Value |
|----------|-------|
| Avatar Size | `32px` circular |
| Dropdown Width | `220px` |
| Dropdown Border Radius | `12px` |
| Item Height | `40px` |
| Item Padding | `12px 16px` |
| Divider | `1px solid #ECE7E3` |
| Shadow | `0 8px 32px rgba(15,23,42,0.12)` |


---

## 🎬 Interactions & Micro-Animations (Exact Timings)

### Hover Transitions
```css
/* सभी hover effects के लिए */
transition: all 120ms ease;
```

### Button Press Effect
```css
/* Click/Press पर */
transform: scale(0.98);
transition: transform 80ms ease;

/* Release पर */
transform: scale(1);
transition: transform 120ms ease;
```

### Drawer/Sidebar Slide
```css
/* Sidebar open/close */
transition: width 180ms ease-out;
/* या transform के साथ */
transition: transform 220ms ease-out;
```

### Modal/Dropdown Fade
```css
/* Appear */
opacity: 0 → 1;
transition: opacity 150ms ease;

/* Disappear */
opacity: 1 → 0;
transition: opacity 100ms ease;
```

### Streaming Token Animation
```
Token append rate: हर 40-80ms में एक token
Natural typing feel के लिए variable delay
Cursor blink: 500ms interval
```

### Tooltip Delay
```
Show after: 500ms hover
Hide: immediate on mouse leave
```

### Button Hover Scale
```css
/* Icon buttons पर hover */
transform: scale(1.05);
transition: transform 120ms ease;
```

### Auto-scroll Behavior
```css
/* New message पर smooth scroll */
scroll-behavior: smooth;
transition: scroll 100ms ease;

/* अगर user ने manually scroll किया है तो auto-scroll बंद */
/* "Scroll to bottom" floating button दिखाओ */
```

---

## 📊 State & Data Contract (Props & Events)

### Sidebar Component
```typescript
// Props
interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isCollapsed: boolean;
  user: User;
}

// Events
onSelect(conversationId: string): void;
onNewChat(): void;
onRename(id: string, newName: string): void;
onDelete(id: string): void;
onToggleCollapse(): void;
onProfileClick(): void;
```

### MessageComposer Component
```typescript
// Props
interface MessageComposerProps {
  draftText: string;
  attachments: Attachment[];
  selectedModelId: string;
  isStreaming: boolean;
  disabled: boolean;
}

// Events
onSend(payload: {
  text: string;
  attachments: Attachment[];
  modelId: string;
  scheduleAt?: Date;
}): void;
onAttachmentAdd(file: File): void;
onAttachmentRemove(id: string): void;
onModelChange(modelId: string): void;
onDraftChange(text: string): void;
```

### ChatWindow Component
```typescript
// Props
interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  conversationId: string;
}

// Events
onStopStreaming(): void;
onRegenerate(messageId: string): void;
onCopyMessage(messageId: string): void;
onScrollToBottom(): void;
```

### Streaming API Contract
```typescript
// Request (Client → Server)
interface StreamRequest {
  userId: string;
  conversationId: string;
  agentId: string;
  modelId: string;
  inputText: string;
  attachments: Attachment[];
  mode: 'live' | 'paper';
}

// Response (Server → Client via SSE/WebSocket)
// Partial token message
interface TokenMessage {
  type: 'token';
  content: string;
  index: number;
}

// Final completion message
interface CompletionMessage {
  type: 'complete';
  messageId: string;
  tokensCount: number;
  costEstimate: number;
  modelVersion: string;
  finishReason: 'stop' | 'length' | 'error';
}

// Error message
interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}
```

---

## ♿ Accessibility (A11y) Notes

### Keyboard Navigation
```
Tab:           सभी interactive elements में navigate करो
Enter/Space:   Buttons activate करो
Escape:        Modals/Dropdowns बंद करो
Arrow Keys:    Lists में navigate करो
Ctrl + K:      Search/Command palette खोलो
Ctrl + N:      New chat
Ctrl + Enter:  Send message (alternative)
```

### ARIA Roles & Attributes
```html
<!-- Sidebar -->
<nav role="navigation" aria-label="Main navigation">

<!-- Chat messages -->
<div role="log" aria-live="polite" aria-label="Chat messages">

<!-- Streaming content -->
<div aria-live="polite" aria-atomic="false">

<!-- Buttons -->
<button aria-label="Send message" aria-disabled="false">

<!-- Dropdowns -->
<div role="listbox" aria-expanded="true">
<div role="option" aria-selected="true">
```

### Focus States
```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid #EECFC1; /* accent color */
  outline-offset: 2px;
}

/* Remove default outline */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Color Contrast (WCAG AA)
```
Primary text (#0F172A) on background (#FBF8F4): ✅ 12.5:1
Muted text (#6B6B6B) on background (#FBF8F4): ✅ 5.2:1
Placeholder (#8B8B8B) on white (#FFFFFF): ✅ 4.5:1
```

### Screen Reader Support
- सभी images में `alt` text
- Icon buttons में `aria-label`
- Streaming responses में `aria-live="polite"`
- Loading states में `aria-busy="true"`


---

## 📱 Responsive Design Rules

### Breakpoints
```css
/* Desktop */
@media (min-width: 1024px) {
  /* Full two-panel layout */
  /* Sidebar: 300px, Main: flexible */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Sidebar collapsed by default */
  /* Main chat centered */
}

/* Mobile */
@media (max-width: 767px) {
  /* Single panel */
  /* Sidebar as overlay drawer */
  /* Composer sticky bottom */
}
```

### Desktop (≥1024px)
```
┌──────────┬─────────────────────────────────┐
│          │                                 │
│ Sidebar  │      Main Chat Area             │
│  300px   │        (flexible)               │
│          │                                 │
│          │    [Centered Input Card]        │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌────┬────────────────────────────────────────┐
│ 72 │                                        │
│ px │        Main Chat Area                  │
│    │          (full width)                  │
│ ☰  │                                        │
│    │      [Centered Input Card]             │
│    │                                        │
└────┴────────────────────────────────────────┘

Sidebar: Collapsed (72px), expand on hover/click
```

### Mobile (≤767px)
```
┌─────────────────────────────────────────────┐
│ ☰  App Title                    [Profile]   │  ← Header
├─────────────────────────────────────────────┤
│                                             │
│           Main Chat Area                    │
│            (full width)                     │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ [Message Composer - sticky bottom]          │
│ [Safe area padding for notch]               │
└─────────────────────────────────────────────┘

Sidebar: Hidden, opens as overlay drawer from left
Model Picker: Opens as bottom sheet modal
```

### Mobile Specific Adjustments
```css
/* Input card full width */
.message-composer {
  width: 100%;
  margin: 0 16px;
  border-radius: 12px; /* slightly smaller */
}

/* Sticky bottom composer */
.composer-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Overlay sidebar */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  z-index: 50;
  transform: translateX(-100%);
}

.sidebar-overlay.open {
  transform: translateX(0);
}

/* Backdrop */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 40;
}
```

---

## ⚡ Performance Optimization Notes

### Streaming Support
```typescript
// SSE (Server-Sent Events) या WebSocket use करो
// Tokens incrementally render करो

const eventSource = new EventSource('/api/chat/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'token') {
    // Append token to current message
    appendToken(data.content);
  } else if (data.type === 'complete') {
    // Finalize message
    finalizeMessage(data);
  }
};
```

### Virtualization (Long Lists)
```typescript
// Conversation list में 100+ items हों तो virtualize करो
// react-virtual या @tanstack/react-virtual use करो

import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: conversations.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 64, // item height
  overscan: 5,
});
```

### Lazy Loading
```typescript
// Heavy assets lazy load करो
// Large avatars, SVG icons, images

const LazyAvatar = lazy(() => import('./Avatar'));

// Code syntax highlighting lazy load
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter')
);
```

### Draft Auto-save
```typescript
// Input draft को localStorage में save करो
// Debounce: 1.5 seconds

const debouncedSave = useMemo(
  () => debounce((text) => {
    localStorage.setItem(`draft_${conversationId}`, text);
  }, 1500),
  [conversationId]
);

useEffect(() => {
  debouncedSave(draftText);
}, [draftText]);
```

### Image Optimization
```typescript
// Next.js Image component use करो
import Image from 'next/image';

<Image
  src={avatarUrl}
  width={32}
  height={32}
  alt="User avatar"
  loading="lazy"
  placeholder="blur"
/>
```

### Bundle Optimization
```
- Code splitting per route
- Dynamic imports for heavy components
- Tree shaking enabled
- Compress assets (gzip/brotli)
```


---

## ✅ QA Acceptance Checklist (Pixel & Behavior Tests)

### Visual Tests (Pixel Perfect)
- [ ] Sidebar width exactly `300px` open, `72px` collapsed
- [ ] Page background color matches `#FBF8F4` (warm-beige)
- [ ] Input card centered horizontally in viewport
- [ ] Input card border radius = `16px`
- [ ] Input card shadow matches spec
- [ ] Model pill positioned right side of composer
- [ ] Model pill background = `#F3E9E3`
- [ ] Placeholder text color = `#8B8B8B`
- [ ] Icon buttons size = `36px × 36px`
- [ ] Hero headline uses serif font
- [ ] Hero headline size = `36-42px`
- [ ] Spacing follows 8px grid system
- [ ] All border radius values match spec

### Interaction Tests
- [ ] Enter key sends message
- [ ] Shift + Enter creates new line
- [ ] Textarea auto-grows from 1 to 6 lines
- [ ] Drag & drop files shows preview chips
- [ ] File chips can be removed
- [ ] Model picker dropdown opens on click
- [ ] Model selection persists per conversation
- [ ] Sidebar collapses/expands smoothly
- [ ] Collapsed sidebar shows tooltips on hover
- [ ] Profile dropdown opens with all menu items
- [ ] Conversation list items are clickable
- [ ] Three-dot menu appears on hover
- [ ] Rename, duplicate, delete actions work

### Streaming Tests
- [ ] Tokens append smoothly (40-80ms intervals)
- [ ] Typing cursor/indicator visible during streaming
- [ ] Stop button appears during streaming
- [ ] Stop button actually stops generation
- [ ] Regenerate button appears after completion
- [ ] Token count displays after completion
- [ ] Auto-scroll works for new messages
- [ ] Auto-scroll pauses when user scrolls up
- [ ] "Scroll to bottom" button appears when scrolled up

### Responsive Tests
- [ ] Desktop layout (≥1024px) shows full sidebar
- [ ] Tablet layout (768-1023px) collapses sidebar
- [ ] Mobile layout (≤767px) hides sidebar
- [ ] Mobile sidebar opens as overlay drawer
- [ ] Mobile composer is sticky at bottom
- [ ] Mobile has safe-area padding
- [ ] Model picker opens as bottom sheet on mobile

### Accessibility Tests
- [ ] All buttons keyboard accessible (Tab)
- [ ] Focus ring visible on keyboard navigation
- [ ] Screen reader announces new messages
- [ ] ARIA labels present on icon buttons
- [ ] Color contrast meets WCAG AA
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate lists

### Performance Tests
- [ ] Initial load < 3 seconds
- [ ] Streaming feels smooth (no jank)
- [ ] Long conversation lists don't lag
- [ ] Draft saves to localStorage
- [ ] No memory leaks on long sessions

---

## 🔧 Edge Cases & Special Behaviors

### Empty State vs Active Chat
```
Empty State:
- Hero headline visible
- Input card centered vertically
- No messages shown

Active Chat:
- Hero hidden
- Messages displayed
- Input card at bottom (sticky)
```

### Model Selection Persistence
```
- Model selection saved per conversation
- New chat uses last selected model
- Model change mid-conversation allowed
```

### Attachment Handling
```
- Max file size: 10MB
- Supported types: images, PDFs, code files
- Show preview for images
- Show file icon + name for others
- Multiple attachments allowed
```

### Error States
```
- Network error: Show retry button
- Rate limit: Show countdown timer
- Invalid input: Show inline error message
- Streaming error: Show error message + regenerate option
```

### Loading States
```
- Initial load: Skeleton screens
- Sending message: Disable send button, show spinner
- Loading conversations: Skeleton list items
- Model switching: Brief loading indicator
```

---

## 📦 Design Tokens JSON (Developer Handoff)

```json
{
  "colors": {
    "background": {
      "page": "#FBF8F4",
      "sidebar": "#F7F4F1",
      "card": "#FFFFFF",
      "hover": "#EDE9E5"
    },
    "accent": {
      "primary": "#EECFC1",
      "secondary": "#F3E9E3"
    },
    "text": {
      "primary": "#0F172A",
      "muted": "#6B6B6B",
      "secondary": "#8B8B8B",
      "placeholder": "#8B8B8B"
    },
    "border": {
      "default": "#ECE7E3",
      "focus": "#EECFC1"
    },
    "status": {
      "error": "#EF4444",
      "success": "#22C55E",
      "warning": "#F59E0B"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "24px",
    "2xl": "32px",
    "3xl": "48px",
    "4xl": "64px"
  },
  "borderRadius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "full": "9999px"
  },
  "shadows": {
    "card": "0 4px 24px rgba(15, 23, 42, 0.06)",
    "dropdown": "0 8px 32px rgba(15, 23, 42, 0.12)",
    "button": "0 2px 8px rgba(15, 23, 42, 0.08)"
  },
  "typography": {
    "fontFamily": {
      "serif": "'Playfair Display', Georgia, serif",
      "sans": "'Inter', system-ui, sans-serif",
      "mono": "'JetBrains Mono', 'Fira Code', monospace"
    },
    "fontSize": {
      "xs": "12px",
      "sm": "13px",
      "base": "14px",
      "md": "15px",
      "lg": "16px",
      "xl": "18px",
      "2xl": "20px",
      "3xl": "24px",
      "4xl": "36px",
      "5xl": "42px"
    },
    "fontWeight": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "animation": {
    "duration": {
      "fast": "80ms",
      "normal": "120ms",
      "slow": "180ms",
      "slower": "220ms"
    },
    "easing": {
      "default": "ease",
      "out": "ease-out",
      "in": "ease-in",
      "inOut": "ease-in-out"
    }
  },
  "breakpoints": {
    "mobile": "767px",
    "tablet": "1023px",
    "desktop": "1024px"
  },
  "sizing": {
    "sidebar": {
      "open": "300px",
      "collapsed": "72px"
    },
    "composer": {
      "minWidth": "680px",
      "maxWidth": "760px"
    },
    "iconButton": "36px",
    "avatar": {
      "sm": "24px",
      "md": "32px",
      "lg": "40px"
    }
  }
}
```


---

## 🎯 Component-wise Implementation Order

### Phase 1: Foundation (Day 1)
1. **Design Tokens Setup**
   - Tailwind config में colors, spacing, fonts add करो
   - CSS variables define करो
   - shadcn/ui theme customize करो

2. **Layout Structure**
   - Main layout component (sidebar + main area)
   - Responsive container setup
   - Background colors apply करो

### Phase 2: Sidebar (Day 2)
3. **Sidebar Component**
   - Logo + title section
   - Navigation items
   - Collapse/expand functionality
   - Profile dropdown

4. **Conversation List**
   - List rendering
   - Active state styling
   - Three-dot menu
   - Virtualization (if needed)

### Phase 3: Chat Area (Day 3-4)
5. **Empty State Hero**
   - Centered layout
   - Serif headline
   - Vertical centering

6. **Message Composer**
   - Textarea with auto-grow
   - Icon buttons
   - Model picker pill
   - Send button
   - Attachment handling

7. **Model Picker Dropdown**
   - Pill button
   - Dropdown with model list
   - Selection state

### Phase 4: Chat Messages (Day 5)
8. **Chat Window**
   - Message list
   - Auto-scroll behavior
   - Scroll to bottom button

9. **Message Bubbles**
   - AI bubble styling
   - User bubble styling
   - Code blocks with syntax highlighting
   - Copy functionality

### Phase 5: Streaming (Day 6)
10. **Streaming Support**
    - SSE/WebSocket connection
    - Token-by-token rendering
    - Typing indicator
    - Stop button
    - Regenerate button

### Phase 6: Polish (Day 7)
11. **Animations & Transitions**
    - Hover effects
    - Button press effects
    - Drawer animations
    - Modal fades

12. **Responsive Testing**
    - Desktop testing
    - Tablet testing
    - Mobile testing
    - Touch interactions

13. **Accessibility Audit**
    - Keyboard navigation
    - Screen reader testing
    - Focus states
    - ARIA attributes

---

## 📋 Final Acceptance Criteria

### "100% Same Look" Checklist
- [ ] Visual match within 2-3px tolerance
- [ ] Same color palette exactly
- [ ] Same typography (fonts, sizes, weights)
- [ ] Same spacing and alignment
- [ ] Same border radius values
- [ ] Same shadow intensities
- [ ] Same icon styles and sizes

### "100% Same Working" Checklist
- [ ] Same keyboard shortcuts
- [ ] Same hover/focus behaviors
- [ ] Same animation timings
- [ ] Same streaming behavior
- [ ] Same responsive breakpoints
- [ ] Same collapse/expand behavior
- [ ] Same dropdown/modal behavior

### "Production Ready" Checklist
- [ ] No console errors
- [ ] No accessibility violations
- [ ] Performance optimized
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Edge cases handled
- [ ] Cross-browser tested

---

## 🚀 Developer Handoff Summary

### Files to Create
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── MainLayout.tsx
│   │   └── Header.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageComposer.tsx
│   │   ├── ModelPicker.tsx
│   │   └── StreamControls.tsx
│   ├── conversation/
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── EmptyState.tsx
│   └── ui/
│       ├── IconButton.tsx
│       ├── Dropdown.tsx
│       └── Avatar.tsx
├── hooks/
│   ├── useStreaming.ts
│   ├── useAutoScroll.ts
│   └── useDraftSave.ts
├── lib/
│   ├── tokens.ts
│   └── api.ts
└── styles/
    └── globals.css
```

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: Zustand या React Context
- **Streaming**: SSE या WebSocket
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Inter, Playfair Display)

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "lucide-react": "^0.300.0",
    "zustand": "^4.4.0",
    "@tanstack/react-virtual": "^3.0.0",
    "react-syntax-highlighter": "^15.5.0"
  }
}
```

---

## 🎉 Conclusion

यह document एक **complete implementation guide** है जो Claude/Apo style AI Chat UI बनाने के लिए सभी जरूरी details provide करता है:

✅ **Exact visual specs** - Colors, spacing, typography  
✅ **Component breakdown** - हर component की detailed specs  
✅ **Interaction details** - Animations, timings, behaviors  
✅ **Data contracts** - Props, events, API formats  
✅ **Accessibility** - Keyboard, ARIA, contrast  
✅ **Responsive rules** - Desktop, tablet, mobile  
✅ **Performance tips** - Streaming, virtualization, lazy loading  
✅ **QA checklist** - Pixel और behavior tests  

**इस guide को follow करके frontend engineer बिल्कुल same looking और same working UI बना सकता है।**

---

**Document Version**: 1.0  
**Created**: 12 December 2025  
**Language**: Hindi + Technical English  
**Purpose**: Frontend Implementation Guide  
**Target**: Next.js + Tailwind + shadcn/ui

---

**अगला Step**: 
- "components" बोलो → Component-by-component detailed spec
- "streaming" बोलो → Streaming backend contract (SSE/WebSocket schema)
