# ContentEditable Inline Badge System

## Overview

Implementation of drag-and-drop functionality for reference images into a rich-text editor area with native inline badge representation. Uses a `contentEditable` div so the browser handles cursor positioning natively — eliminating the caret drift that affected the previous textarea+overlay approach.

## Why ContentEditable (not textarea+overlay)

The textarea+overlay approach had a fundamental flaw: hidden placeholder characters in the textarea had a different rendered width than the visual badge in the overlay. This gap grew with each badge on the same line and worsened when a scrollbar appeared. No amount of character-counting or width measurement could fix this reliably.

With `contentEditable`:
- Badge spans are actual DOM elements (`contentEditable={false}`)
- The browser places the cursor natively, so alignment is always pixel-perfect
- No overlay, no hidden markers, no width-matching math needed

## Key Features

### 1. Drag & Drop Functionality
- Reference images are draggable with `cursor-move` styling
- Editor accepts drops; drop position is calculated using `document.caretRangeFromPoint()`
- The browser sets the exact caret position at the drop coordinates

### 2. Visual Badge System
- **Small image thumbnail** (16x16px) showing the actual reference image
- **"Image X" label** with cyan styling
- **Inline display** that flows with text content
- **`contentEditable={false}`** on each badge span — treated as a single atomic unit
- **× remove button** on the right side of each badge; clicking removes the badge and updates the plain-text state

### 3. Auto-Growing Editor
- CSS `min-height` / `max-height` handles grow automatically — no JS needed
- Scrollbar appears only after content exceeds `200px`

## Implementation Details

### State Management
```typescript
// Constants for mention system
const TEXTAREA_MIN_HEIGHT = 60;
const TEXTAREA_MAX_HEIGHT = 200;

// Refs
const editorRef = useRef<HTMLDivElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const uploadInputRef = useRef<HTMLInputElement>(null);
const isComposingRef = useRef(false);
const savedSelectionRef = useRef<{ container: Node; offset: number } | null>(null);

// State
const [currentPrompt, setCurrentPrompt] = useState(userPrompt ?? "");
const [editorIsEmpty, setEditorIsEmpty] = useState(!userPrompt);

// Model options for describe mode
const inpaintModelOptions = [
  { value: "nano-banana-2", label: "🟩 Nano Banana 2", sub: "General purpose • 40 credits", credits: 40, maxReferenceImages: 13 },
];

// Aspect ratio options
const aspectRatioOptions = [
  { value: "1:1", label: "1:1", sub: "Square" },
  { value: "6:19", label: "6:19", sub: "Portrait" },
  { value: "19:6", label: "19:6", sub: "Landscape" },
];

// Resolution options
const resolutionOptions = [
  { value: "1K", label: "1K", sub: "1024×1024" },
  { value: "2K", label: "2K", sub: "2048×2048" },
];

// Output format options
const outputFormatOptions = [
  { value: "png", label: "PNG", sub: "Lossless" },
  { value: "jpg", label: "JPG", sub: "Compressed" },
];

// State for new dropdowns
const [aspectRatio, setAspectRatio] = useState("1:1");
const [resolution, setResolution] = useState("1K");
const [outputFormat, setOutputFormat] = useState("png");

// Dropdown visibility states
const [showModelDropdown, setShowModelDropdown] = useState(false);
const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
const [showOutputFormatDropdown, setShowOutputFormatDropdown] = useState(false);
```

### Plain Text Extraction
```typescript
const extractPlainText = (): string => {
  const el = editorRef.current;
  if (!el) return "";
  const collect = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    const htmlEl = node as HTMLElement;
    if (htmlEl.nodeName === "BR") return "\n";
    if (htmlEl.dataset?.type === "mention") return "";
    let result = "";
    node.childNodes.forEach((child) => { result += collect(child); });
    if (htmlEl.tagName === "DIV" && node !== el) result += "\n";
    return result;
  };
  return collect(el).replace(/\n$/, "");
};
```

### Badge DOM Creation
```typescript
const createBadgeElement = (entry: { id: string; imageUrl: string; imageNumber: number }): HTMLSpanElement => {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.type = "mention";
  span.dataset.mentionId = entry.id;
  span.setAttribute(
    "class",
    "inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/40 rounded px-1.5 py-0.5 align-middle mx-0.5 select-none"
  );
  span.style.cursor = "default";
  span.style.fontSize = "inherit";

  const img = document.createElement("img");
  img.src = entry.imageUrl;
  img.alt = `Image ${entry.imageNumber}`;
  img.setAttribute("class", "w-4 h-4 object-cover rounded");

  const label = document.createElement("span");
  label.setAttribute("class", "text-cyan-300 text-sm font-medium whitespace-nowrap");
  label.textContent = `Image ${entry.imageNumber}`;

  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("type", "button");
  closeBtn.setAttribute("title", "Remove");
  closeBtn.setAttribute(
    "class",
    "ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-cyan-400/70 hover:text-white hover:bg-cyan-400/30 transition-colors"
  );
  closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const editor = editorRef.current;
    span.remove();
    if (editor) {
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  span.appendChild(img);
  span.appendChild(label);
  span.appendChild(closeBtn);
  return span;
};
```

### Insert Badge at Caret
```typescript
const insertBadgeAtCaret = (entry: { id: string; imageUrl: string; imageNumber: number }) => {
  const el = editorRef.current;
  if (!el) return;
  el.focus();
  const selection = window.getSelection();
  if (!selection) return;
  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    range.deleteContents();
  } else if (savedSelectionRef.current) {
    try {
      range = document.createRange();
      range.setStart(savedSelectionRef.current.container, savedSelectionRef.current.offset);
      range.collapse(true);
      selection.addRange(range);
    } catch {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.addRange(range);
    }
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.addRange(range);
    range = selection.getRangeAt(0);
  }
  const badge = createBadgeElement(entry);
  range.insertNode(badge);
  const newRange = document.createRange();
  newRange.setStartAfter(badge);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  setEditorIsEmpty(false);
  setTimeout(() => {
    const plainText = extractPlainText();
    setCurrentPrompt(plainText);
    onUserPromptChange?.(plainText);
  }, 0);
};
```

### Drag & Drop
```typescript
const handleDragStart = (e: React.DragEvent, imageUrl: string, imageIndex: number) => {
  e.dataTransfer.setData("imageUrl", imageUrl);
  e.dataTransfer.setData("imageIndex", imageIndex.toString());
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  setTextareaScrollLeft(e.currentTarget.scrollLeft);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const imageUrl = e.dataTransfer.getData("imageUrl");
  const imageIndex = e.dataTransfer.getData("imageIndex");
  if (!imageUrl || imageIndex === "") return;
  const imageNumber = parseInt(imageIndex) + 1;
  let range: Range | null = null;
  const doc = document as any;
  if (typeof doc.caretRangeFromPoint === "function") {
    range = doc.caretRangeFromPoint(e.clientX, e.clientY);
  } else if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }
  if (range) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl, imageNumber });
};
```

### Editor JSX
```tsx
<div
  ref={editorRef}
  contentEditable={true}
  suppressContentEditableWarning={true}
  onInput={handleEditorInput}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onBlur={handleEditorBlur}
  onCompositionStart={handleCompositionStart}
  onCompositionEnd={handleCompositionEnd}
  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500/30 leading-6 text-sm selection:bg-white/20"
  style={{
    minHeight: `${TEXTAREA_MIN_HEIGHT}px`,
    maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }}
/>
{editorIsEmpty && (
  <div className="absolute top-2 left-3 right-3 text-gray-500 text-sm pointer-events-none select-none leading-6">
    Describe your element... drag &amp; drop reference images here
  </div>
)}

## Component Structure

### Reference Images Section
```tsx
<div className="flex gap-2 overflow-x-auto pb-2">
  {referenceImages.map((img, index) => (
    <div key={img.id} className="relative flex-shrink-0 group">
      <img
        src={img.url}
        alt={`Reference ${index + 1}`}
        className="w-20 h-20 object-cover rounded-lg border border-white/10 cursor-move relative z-10"
        draggable
        onDragStart={(e) => handleDragStart(e, img.url, index)}
      />
      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] px-1 rounded-full z-20">
        Image {index + 1}
      </div>
      <button
        onClick={() => insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl: img.url, imageNumber: index + 1 })}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center z-0"
        title="Insert mention"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => onRemoveReferenceImage?.(img.id)}
        className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
      >
        <X className="w-2.5 h-2.5 text-white" />
      </button>
    </div>
  ))}
  
  {/* Add reference button */}
  <button
    onClick={() => fileInputRef.current?.click()}
    className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-white/30 transition-colors flex flex-col items-center justify-center gap-1 group"
  >
    <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
    <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">Add</span>
  </button>
</div>

### Dropdown Components (Model, Aspect Ratio, Resolution, Format)
```tsx
{/* Model Select Box */}
<div className="relative" style={{ width: "160px" }}>
  <button
    onClick={() => setShowModelDropdown(!showModelDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{inpaintModelOptions.find(m => m.value === model)?.label || "Select Model"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showModelDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {inpaintModelOptions.map((modelOption) => (
          <button
            key={modelOption.value}
            onClick={() => {
              onModelChange?.(modelOption.value);
              setShowModelDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              model === modelOption.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{modelOption.label}</div>
            <div className="text-[11px] text-gray-500">{modelOption.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Aspect Ratio Select Box */}
<div className="relative" style={{ width: "120px" }}>
  <button
    onClick={() => setShowAspectRatioDropdown(!showAspectRatioDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{aspectRatioOptions.find(o => o.value === aspectRatio)?.label || "Ratio"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showAspectRatioDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {aspectRatioOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setAspectRatio(option.value);
              setShowAspectRatioDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              aspectRatio === option.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px] text-gray-500">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Resolution Select Box */}
<div className="relative" style={{ width: "100px" }}>
  <button
    onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{resolutionOptions.find(o => o.value === resolution)?.label || "Res"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showResolutionDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {resolutionOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setResolution(option.value);
              setShowResolutionDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              resolution === option.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px] text-gray-500">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Output Format Select Box */}
<div className="relative" style={{ width: "100px" }}>
  <button
    onClick={() => setShowOutputFormatDropdown(!showOutputFormatDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{outputFormatOptions.find(o => o.value === outputFormat)?.label || "Format"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showOutputFormatDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {outputFormatOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setOutputFormat(option.value);
              setShowOutputFormatDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              outputFormat === option.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px] text-gray-500">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>