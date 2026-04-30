import { getAnthropicClient } from "@/lib/support/anthropic";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnalyzedScene {
  sceneId: string;        // "scene_1a", "scene_2b", "scene_4"
  act: number;            // 1, 2, 3, 4
  order: number;          // Global order index 0, 1, 2...
  title: string;          // "Surface to Deep"
  actTitle: string;       // "DESCENT"
  description: string;    // Full narrative description
  imagePrompt: string;    // Extracted image prompt
  videoPrompt: string;    // Extracted video prompt
  duration: number;       // Duration in seconds
  modelHint?: string;     // "seedance-1.5-pro" | "seedance-2.0-fast" etc.
  camera?: string;        // Camera direction summary
  timeRange?: string;     // "0:00-0:12"
  defaultImageModel?: string; // Reference for AI agent (always "gpt-image-2-image-to-image")
  defaultVideoModel?: string; // Reference for AI agent (from modelHint or "bytedance/seedance-2-fast")
}

export interface AnalyzedElement {
  name: string;
  type: "character" | "environment" | "prop";
  description: string;    // Detailed physical description (min 30 chars)
  sceneIds: string[];     // Which scenes this element appears in
  occurrenceCount: number;
  importance: "primary" | "secondary";
  tags: string[];
}

export interface ScriptAnalysisResult {
  title: string;
  genre: string;
  preamble: string;       // Text before first ACT/SCENE — project description
  totalDuration: number;
  actCount: number;
  scenes: AnalyzedScene[];
  elements: AnalyzedElement[];
  confidence: "high" | "medium" | "low";
  parseMethod: "structured" | "freeform";
}


// ── Main entry point ─────────────────────────────────────────────────────────

export async function analyzeScript(
  scriptContent: string,
  onProgress?: (message: string) => void
): Promise<ScriptAnalysisResult> {
  const progress = onProgress ?? (() => {});

  // Step 1: Detect if script has structured markers
  progress("Detecting script format...");
  const hasPromptMarkers = /image\s*prompt/i.test(scriptContent) || /video\s*prompt/i.test(scriptContent);
  const hasSceneMarkers = /SCENE\s+\d/i.test(scriptContent);

  let scenes: AnalyzedScene[];

  if (hasPromptMarkers && hasSceneMarkers) {
    // STRUCTURED script (like THE BLOOP) — regex extracts heavy text, AI only parses structure
    progress("Parsing structured script...");
    scenes = await parseStructuredScript(scriptContent);
  } else {
    // FREE-FORM script — AI does everything (works for shorter scripts)
    progress("Parsing script with AI...");
    scenes = await parseFreeformScript(scriptContent);
  }

  // Step 1.5: Stamp default models on each scene
  for (const scene of scenes) {
    scene.defaultImageModel = "gpt-image-2-image-to-image";
    if (scene.modelHint === "seedance-1.5-pro") {
      scene.defaultVideoModel = "bytedance/seedance-1.5-pro";
    } else {
      scene.defaultVideoModel = "bytedance/seedance-2-fast";
    }
  }

  // Step 2: Extract elements with AI (smart filtering)
  progress(`Found ${scenes.length} scenes. Extracting elements...`);
  const elements = await extractElements(scriptContent, scenes);


  progress("Analysis complete.");

  const confidence: "high" | "medium" | "low" =
    scenes.length > 0 && hasPromptMarkers ? "high" :
    scenes.length > 0 ? "medium" : "low";

  return {
    title: extractTitle(scriptContent),
    genre: extractGenre(scriptContent),
    preamble: extractPreamble(scriptContent),
    totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
    actCount: new Set(scenes.map(s => s.act)).size,
    scenes,
    elements,
    confidence,
    parseMethod: hasPromptMarkers && hasSceneMarkers ? "structured" : "freeform",
  };
}

// ── STRUCTURED script parser (regex + light AI) ─────────────────────────────
// For scripts with explicit markers: ACT, SCENE, Image Prompt, Video Prompt
// Regex handles the heavy text extraction. AI only needed for elements.
// Scales to 60+ scenes because output is zero AI tokens per scene.

async function parseStructuredScript(scriptContent: string): Promise<AnalyzedScene[]> {
  const scenes: AnalyzedScene[] = [];

  // Split script into scene blocks
  // Match patterns like: SCENE 1A, SCENE 1B, SCENE 2A, SCENE 4
  const sceneBlockRegex = /SCENE\s+(\d+)([A-Z]?)[\s\S]*?(?=SCENE\s+\d|$)/gi;
  let blockMatch;

  // Track current act
  let currentAct = 1;
  let currentActTitle = "";
  let order = 0;

  // First pass: find all ACT markers and their positions
  const actMarkers: { position: number; act: number; title: string }[] = [];
  const actRegex = /ACT\s+(\d+)[^—\n]*(?:—\s*(.+?))?$/gim;
  let actMatch;
  while ((actMatch = actRegex.exec(scriptContent)) !== null) {
    actMarkers.push({
      position: actMatch.index,
      act: parseInt(actMatch[1]),
      title: actMatch[2]?.trim() || `Act ${actMatch[1]}`,
    });
  }

  // Second pass: extract scenes
  while ((blockMatch = sceneBlockRegex.exec(scriptContent)) !== null) {
    const sceneNum = blockMatch[1];
    const sceneSub = (blockMatch[2] || "").toLowerCase();
    const block = blockMatch[0];
    const blockPosition = blockMatch.index;

    // Determine which act this scene belongs to
    for (const marker of actMarkers) {
      if (marker.position <= blockPosition) {
        currentAct = marker.act;
        currentActTitle = marker.title;
      }
    }

    const sceneId = sceneSub ? `scene_${sceneNum}${sceneSub}` : `scene_${sceneNum}`;

    // Extract title — text after SCENE label, before newline
    const titleMatch = block.match(/SCENE\s+\d+[A-Z]?\s*[\(（][^)）]*[\)）]\s*(?:—|–|-)\s*(.+)/i)
      || block.match(/SCENE\s+\d+[A-Z]?\s*(?:—|–|-)\s*(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : `Scene ${sceneNum}${sceneSub.toUpperCase()}`;

    // Extract duration from time range or explicit duration
    let duration = 5; // default
    const timeRangeMatch = block.match(/\((\d+):(\d+)\s*[–-]\s*(\d+):(\d+)\)/);
    if (timeRangeMatch) {
      const startSec = parseInt(timeRangeMatch[1]) * 60 + parseInt(timeRangeMatch[2]);
      const endSec = parseInt(timeRangeMatch[3]) * 60 + parseInt(timeRangeMatch[4]);
      duration = endSec - startSec;
    }
    const durationMatch = block.match(/(\d+)\s*s(?:ec|econds?)?\b/i);
    if (durationMatch && !timeRangeMatch) {
      duration = parseInt(durationMatch[1]);
    }

    // Extract time range string
    const timeRange = timeRangeMatch
      ? `${timeRangeMatch[1]}:${timeRangeMatch[2]}-${timeRangeMatch[3]}:${timeRangeMatch[4]}`
      : undefined;

    // Extract model hint
    let modelHint: string | undefined;
    if (/seedance\s*2\.0/i.test(block) || /2\.0\s*fast/i.test(block)) {
      modelHint = "seedance-2.0-fast";
    } else if (/seedance\s*1\.5/i.test(block) || /1\.5\s*pro/i.test(block)) {
      modelHint = "seedance-1.5-pro";
    }

    // Extract image prompt — everything between "Image Prompt:" and the next section marker
    const imagePrompt = extractSection(block, /(?:image\s*prompt|🖼️\s*image\s*prompt)\s*:?\s*/i,
      /(?:🎬|video\s*prompt|camera|duration|---)/i);

    // Extract video prompt — everything between "Video Prompt:" and the next section marker
    const videoPrompt = extractSection(block, /(?:video\s*prompt|🎬\s*video\s*prompt)\s*:?\s*/i,
      /(?:---|SCENE\s+\d|ACT\s+\d|$)/i);

    // Extract description — the narrative text (not prompts)
    // This is everything that's not a prompt, marker, or metadata
    const description = extractDescription(block);

    scenes.push({
      sceneId,
      act: currentAct,
      order: order++,
      title,
      actTitle: currentActTitle,
      description,
      imagePrompt,
      videoPrompt,
      duration,
      modelHint,
      timeRange,
    });
  }

  // Fallback: if regex found nothing, try the old SCENE N: format
  if (scenes.length === 0) {
    const simpleRegex = /SCENE\s+(\d+)\s*:\s*(.+?)[\n\r]([\s\S]*?)(?=SCENE\s+\d|$)/gi;
    let simpleMatch;
    let fallbackOrder = 0;
    while ((simpleMatch = simpleRegex.exec(scriptContent)) !== null) {
      const num = simpleMatch[1];
      const title = simpleMatch[2].trim();
      const body = simpleMatch[3].trim();
      scenes.push({
        sceneId: `scene_${num}`,
        act: 1,
        order: fallbackOrder++,
        title,
        actTitle: "",
        description: body.substring(0, 500),
        imagePrompt: "",
        videoPrompt: "",
        duration: 5,
      });
    }
  }

  return scenes;
}

// Extract text between a start marker and an end marker
function extractSection(block: string, startPattern: RegExp, endPattern: RegExp): string {
  const startMatch = startPattern.exec(block);
  if (!startMatch) return "";

  const afterStart = block.substring(startMatch.index + startMatch[0].length);
  const endMatch = endPattern.exec(afterStart);
  const text = endMatch ? afterStart.substring(0, endMatch.index) : afterStart;

  return text.trim();
}

// Extract description from a scene block (narrative text, excluding prompts/metadata)
function extractDescription(block: string): string {
  // Remove known sections
  let desc = block
    .replace(/SCENE\s+\d+[A-Z]?[^\n]*/gi, "")
    .replace(/(?:🖼️\s*)?image\s*prompt\s*:?\s*[\s\S]*?(?=(?:🎬|video\s*prompt)|$)/gi, "")
    .replace(/(?:🎬\s*)?video\s*prompt\s*:?\s*[\s\S]*?(?=---|SCENE\s+\d|ACT\s+\d|$)/gi, "")
    .replace(/>\s*🟢.*$/gm, "")
    .replace(/>\s*🔴.*$/gm, "")
    .replace(/>\s*💡.*$/gm, "")
    .replace(/>\s*💰.*$/gm, "")
    .replace(/---/g, "")
    .trim();

  // Clean up multiple newlines
  desc = desc.replace(/\n{3,}/g, "\n\n").trim();

  return desc || "";
}

// ── FREE-FORM script parser (AI does everything) ────────────────────────────
// For scripts without explicit markers. AI generates structure + prompts.
// Works well for shorter scripts (<20 scenes).

async function parseFreeformScript(scriptContent: string): Promise<AnalyzedScene[]> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 8192,
    system: `You are a script-to-storyboard parser. The script has no standard markers, so you must identify scene boundaries yourself.

RULES:
- Identify natural scene breaks (location changes, time jumps, perspective shifts)
- Generate an image prompt for each scene (detailed visual description for AI image generation)
- Generate a video prompt for each scene (camera movement, timing, action)
- sceneId format: "scene_1", "scene_2", etc.
- Keep descriptions concise (1-2 sentences)

RETURN ONLY valid JSON, no markdown:
{
  "scenes": [
    {
      "sceneId": "scene_1",
      "act": 1,
      "order": 0,
      "title": "Scene title",
      "actTitle": "",
      "description": "Brief scene description",
      "imagePrompt": "Detailed visual prompt for AI image generation...",
      "videoPrompt": "Camera movement and action description...",
      "duration": 5,
      "modelHint": null,
      "camera": "Wide shot",
      "timeRange": null
    }
  ]
}`,
    messages: [
      { role: "user", content: `Parse this script into storyboard scenes:\n\n${scriptContent}` },
    ],
  });

  const text = response.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const cleanText = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleanText);
    return (parsed.scenes || []) as AnalyzedScene[];
  } catch {
    console.error("[scriptAnalyzer] Failed to parse freeform JSON:", text.substring(0, 200));
    return [];
  }
}

// ── Element extraction (smart filtering) ─────────────────────────────────────

async function extractElements(
  scriptContent: string,
  scenes: AnalyzedScene[]
): Promise<AnalyzedElement[]> {
  try {
  const anthropic = getAnthropicClient();

  const sceneList = scenes.map(s => `${s.sceneId}: ${s.title}`).join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: `You extract reusable visual elements from scripts for storyboard production. STRICT quality over quantity — aim for 3-6 elements total.

CHARACTERS: Named or uniquely described individuals only. Must be a single person or creature.
  SKIP: groups ("crew", "crowd", "people", "figures", "team", "soldiers"), unnamed extras, roles that are just a job title without visual distinction.

ENVIRONMENTS: Major DISTINCT locations that appear in 2+ scenes. One location per distinct place.
  SKIP: sub-locations inside a parent (e.g. "cockpit" when "submarine" exists), rooms/areas within an already-extracted location, minor transition spaces.

PROPS: Standalone key story objects that could be generated as their own reference image. Must be a whole object, not a part.
  SKIP: components/parts of a vehicle or building (porthole, panel, dashboard, steering wheel, headlights, spotlights, engine, door, window, screen, gauge, lever, seat = part of the parent object), atmospheric/environmental effects (snow, fog, mist, rain, light beams, shadows, particles, dust, bubbles), generic materials (water, glass, metal, darkness).

STRICT DEDUPLICATION: Never extract both a parent and its part. If "Submarine" is extracted, do NOT also extract "Submarine Porthole", "Submarine Cabin Interior", "Instrument Panel" etc. Pick the broadest useful version only.

occurrenceCount = number of distinct scenes where this element is visually prominent.
Descriptions must be 30+ chars describing VISUAL appearance for AI image generation.

SCENES: ${sceneList}

RETURN ONLY valid JSON (no markdown, no code fences):
{"elements":[{"name":"...","type":"character","description":"...","sceneIds":["scene_1a"],"occurrenceCount":2,"importance":"primary","tags":["human"]}]}`,
    messages: [
      { role: "user", content: `Extract high-value elements:\n\n${scriptContent}` },
    ],
  });

  const text = response.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    // Strip markdown code fences if present (Haiku sometimes wraps JSON in ```json ... ```)
    const cleanText = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleanText);
    const elements = (parsed.elements || []) as AnalyzedElement[];
    // Hard blocklist for parts/components that AI often extracts despite instructions
    const PART_WORDS = /\b(porthole|panel|dashboard|gauge|lever|screen|monitor|dial|switch|button|seat|window|door|hatch|engine|spotlight|headlight|antenna|cable|pipe|valve|vent|hull|deck|railing|ladder|console|cockpit|interior|cabin)\b/i;
    const GROUP_WORDS = /^(crew|crowd|people|figures|team|soldiers|group|extras|bystanders|villagers|citizens|passengers|workers|guards)\b/i;

    const filtered = elements.filter(el => {
      if (!el.name || !el.description || el.description.length < 20 || el.sceneIds.length === 0) return false;

      // Block groups/unnamed extras for characters
      if (el.type === "character" && GROUP_WORDS.test(el.name)) return false;

      // Block parts/components for props and environments
      if ((el.type === "prop" || el.type === "environment") && PART_WORDS.test(el.name)) return false;

      // Characters: always keep. Environments/props: only if 2+ occurrences.
      if (el.type === "character") return true;
      return el.occurrenceCount >= 2 || el.sceneIds.length >= 2;
    });

    // Dedup: if a parent object exists (e.g. "Submarine"), remove child variants (e.g. "Submarine Porthole")
    const names = filtered.map(e => e.name.toLowerCase());
    const deduped = filtered.filter(el => {
      const lower = el.name.toLowerCase();
      // Check if any other element's name is a prefix of this one (parent exists)
      return !names.some(other => other !== lower && lower.startsWith(other + " "));
    });
    console.log(`[scriptAnalyzer] Extracted ${elements.length} raw → ${filtered.length} filtered → ${deduped.length} deduped:`, deduped.map(e => `${e.name} (${e.type})`));
    return deduped;
  } catch {
    console.error("[scriptAnalyzer] Failed to parse element JSON:", text.substring(0, 200));
    return [];
  }
  } catch (err) {
    console.error("[scriptAnalyzer] Element extraction failed entirely:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ── Simple helpers ───────────────────────────────────────────────────────────

function extractTitle(script: string): string {
  const mdMatch = script.match(/^#\s+(.+)/m);
  if (mdMatch) return mdMatch[1].replace(/[*"]/g, "").trim();
  const titleMatch = script.match(/\*\*Title:\*\*\s*(.+)/i);
  if (titleMatch) return titleMatch[1].trim();
  const lines = script.split("\n").filter(l => l.trim().length > 0);
  for (const line of lines.slice(0, 5)) {
    const clean = line.replace(/[#*"]/g, "").trim();
    if (clean.length > 3 && clean.length < 80) return clean;
  }
  return "Untitled";
}

function extractGenre(script: string): string {
  const match = script.match(/\*\*Genre:\*\*\s*(.+)/i);
  if (match) return match[1].trim();
  const lower = script.toLowerCase();
  if (lower.includes("horror") || lower.includes("creature")) return "Sci-Fi Horror";
  if (lower.includes("comedy") || lower.includes("funny")) return "Comedy";
  if (lower.includes("submarine") || lower.includes("deep sea")) return "Sci-Fi Thriller";
  return "Drama";
}

function extractPreamble(script: string): string {
  // Everything before the first ACT or SCENE marker
  const firstMarker = script.search(/\bACT\s+\d|\bSCENE\s+\d/i);
  if (firstMarker <= 0) return "";
  const raw = script.substring(0, firstMarker).trim();
  // Clean up markdown artifacts but keep the content readable
  return raw
    .replace(/^#+\s*/gm, "")        // remove # headers
    .replace(/\*\*/g, "")           // remove bold markers
    .replace(/^>\s*/gm, "")         // remove blockquote markers
    .replace(/^---+$/gm, "")        // remove horizontal rules
    .replace(/\n{3,}/g, "\n\n")     // collapse multiple newlines
    .trim();
}
