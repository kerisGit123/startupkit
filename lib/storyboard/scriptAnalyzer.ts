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
  description: string;              // Rich visual description (100+ chars) for image generation
  identity?: Record<string, any>;   // Structured wizard fields (gender, hairColor, mood, material, etc.)
  sceneIds: string[];               // Which scenes this element appears in
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
    max_tokens: 6000,
    system: `You are an experienced movie production designer extracting reference assets from a script. Your task: identify the visual elements that genuinely need dedicated reference images to maintain consistency across multiple shots.

CORE QUESTION before adding any element: "Would I pin this to my production reference board and generate a standalone reference image for it?" If the answer is no, skip it.

━━━ WHAT TO EXTRACT ━━━

CHARACTERS — Named individuals OR any living creature/being with a specific appearance the art department must match scene after scene.
  ✓ "Dr. Sarah Chen" — lead scientist with described appearance
  ✓ "The Creature" — deep-sea monster; type=character, non-human
  ✓ "The Dragon" — even if only its claw or eye appears on screen; type=character, non-human
  ✗ "Crew" / "Scientists" / "Guards" — unnamed groups, no specific design
  ✗ Any role mentioned once without a described appearance

  CRITICAL — LIVING CREATURES ARE ALWAYS CHARACTERS, NEVER PROPS:
  Any animal, monster, beast, alien, creature, entity — even if the script only shows a body part
  (eye, claw, tentacle, fin, jaw) — is a living being. Extract the WHOLE CREATURE as type=character.
  Name it after the creature, NOT the body part.
  ✗ "Creature Eye" as prop  →  ✓ "The Creature" as character (non-human)
  ✗ "Monster Tentacle" as prop  →  ✓ "The Monster" as character (non-human)
  ✗ "Giant Claw" as prop  →  ✓ "The Giant" as character (non-human)
  ✗ "Alien Appendage" as prop  →  ✓ "The Alien" as character (non-human)

ENVIRONMENTS — The PRIMARY location(s) the entire story is set in. One entry per distinct place.
  ✓ "Aquarium Research Center" — main location, needs consistent look
  ✓ "Deep Ocean Floor" — recurring distinct location
  ✗ "Computer Lab" — sub-room inside the Research Center already extracted
  ✗ "Corridor", "Observation Room" — architectural sub-spaces of a parent location
  ✗ Transition spaces or locations that appear in only one scene

PROPS — HERO PROPS only: INANIMATE objects that are central to the plot, have a unique recognisable design, and must look identical every time they appear. A prop has no life — it does not breathe, move, think, or feel.
  ✓ "The Research Submarine" — hero vehicle, unique design, appears throughout
  ✓ "Ancient Artifact" — plot-driving object with specific described appearance
  ✗ "Aquarium Glass" — a surface/material of the environment, not a standalone object
  ✗ "Research Computer" — generic set dressing any art director would place
  ✗ "Fish Tank" — part of the aquarium environment
  ✗ "Desk", "Chair", "Shelf" — generic furniture, set dressing
  ✗ "Computer Monitor", "Keyboard", "Screen" — generic technology set dressing
  ✗ "Lab Equipment", "Instruments" — vague generic items
  ✗ Any body part of a living creature (eye, claw, tentacle, paw, wing, fin, tail, jaw, fang) — that is a CHARACTER

━━━ STRICT RULES ━━━

1. NEVER extract a sub-component of something already extracted. If "Research Submarine" is in the list, do NOT add "Submarine Porthole", "Submarine Interior", "Instrument Panel", "Control Console", "Periscope", "Hatch".
2. NEVER extract a sub-location of an extracted environment. If "Aquarium Research Center" is in the list, do NOT add "Computer Room", "Observation Deck", "Storage Bay", "Control Room" within it.
3. NEVER extract generic set dressing: computers, desks, chairs, tables, shelves, lamps, cables, generic machinery, glass surfaces, water, fog, mist, particles, light beams, shadows.
4. A prop must have a UNIQUE DESIGN described in the script. "A computer" is not unique. "A cracked obsidian sphere with glowing blue veins" is.
5. Body parts of living creatures are NEVER props — reclassify as the whole creature (type=character, non-human).
6. Aim for 2–5 elements total. Fewer high-confidence elements always beats many low-confidence ones.

━━━ DESCRIPTION FORMAT (100+ chars) ━━━
CHARACTER: "[Build] [age] [ethnicity] [gender] with [hair description] and [eye color] eyes. Wearing [specific outfit]. [Distinctive features: scars, tattoos, accessories]."
ENVIRONMENT: "Establishing shot of [location] at [time of day]. [Key architectural/natural features]. [Lighting, atmosphere, color palette]. [Scale and mood]."
PROP: "A [size] [material] [object name]. [Shape, colors, surface texture, condition]. [Any distinctive markings, engravings, or damage]. Standalone product photograph."

━━━ IDENTITY FIELDS ━━━
CHARACTER: gender("male"|"female"|"non-binary"|"other"), ageRange("child"|"teen"|"young-adult"|"adult"|"middle-aged"|"elderly"), ethnicity("east-asian"|"south-asian"|"southeast-asian"|"black"|"white"|"latino"|"middle-eastern"|"mixed"|"other"), build("slim"|"average"|"athletic"|"muscular"|"stocky"), hairColor("black"|"brown"|"blonde"|"red"|"white"), hairStyle("short-straight"|"short-curly"|"medium-straight"|"medium-wavy"|"long-straight"|"long-curly"|"long-wavy"|"braids"|"bald"|"buzz-cut"), eyeColor("brown"|"blue"|"green"|"hazel"|"gray"|"amber"), outfit("casual"|"formal"|"military"|"sporty"|"sci-fi"|"historical"|"uniform"), outfitCustom(text), detailsCustom(text — distinctive features), expression("neutral"|"serious"|"confident"|"mysterious"|"fearful"), era("modern"|"near-future"|"far-future"|"fantasy"|"1920s"|"1940s"|"1960s"|"1980s"|"timeless")
  Non-human: characterKind(free text, e.g. "research submarine"), isNonHuman: true, put all visual detail in detailsCustom

ENVIRONMENT: timeOfDay("dawn"|"morning"|"noon"|"afternoon"|"golden-hour"|"sunset"|"dusk"|"night"|"midnight"), weather("clear"|"cloudy"|"foggy"|"rainy"|"stormy"|"misty"), mood("eerie"|"grand"|"claustrophobic"|"serene"|"vast"|"mysterious"|"cozy"|"chaotic"), keyFeatures(text — comma-separated key visual elements), customNotes(text)

PROP: category("vehicle"|"weapon"|"tool"|"furniture"|"technology"|"container"|"misc"), material("metal"|"wood"|"plastic"|"glass"|"leather"|"stone"|"fabric"|"crystal"), size("tiny"|"small"|"medium"|"large"|"massive"), condition("pristine"|"worn"|"damaged"|"weathered"|"rusted"), details(text — shape, colors, distinctive markings), era("modern"|"futuristic"|"vintage"|"ancient"|"steampunk")

occurrenceCount = number of distinct scenes where this element is visually prominent.
IMPORTANT: Use ONLY the exact scene IDs from the list below — copy them character-for-character. Do NOT invent IDs or omit letter suffixes (e.g. use "scene_1a" not "scene_1").
SCENES: ${sceneList}

RETURN ONLY valid JSON (no markdown):
{"elements":[{"name":"...","type":"character","description":"...","identity":{...},"sceneIds":["scene_1a","scene_1b"],"occurrenceCount":2,"importance":"primary","tags":["human"]}]}`,
    messages: [
      { role: "user", content: `Extract production reference elements:\n\n${scriptContent}` },
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

    // Build a lookup of valid scene IDs from the actual parsed scenes
    const validSceneIds = new Set(scenes.map(s => s.sceneId));

    // Fuzzy scene ID expansion: "scene_1" → ["scene_1a", "scene_1b"] when the script
    // uses lettered sub-scenes. The AI often omits the letter suffix even though the
    // SCENES list shows the full IDs. We expand parent IDs to all their children so
    // the occurrence count is correct and elements aren't wrongly filtered out.
    const expandSceneId = (id: string): string[] => {
      if (validSceneIds.has(id)) return [id]; // exact match
      const lower = id.toLowerCase();
      // Collect every valid ID that starts with this AI-provided ID (e.g. "scene_1" → "scene_1a", "scene_1b")
      const children = [...validSceneIds].filter(v => v.toLowerCase().startsWith(lower));
      if (children.length > 0) return children;
      // Also accept if the AI added extra detail (e.g. "scene_1_surface" vs "scene_1a") — strip to shared prefix
      const parentMatch = [...validSceneIds].find(v => lower.startsWith(v.toLowerCase()));
      return parentMatch ? [parentMatch] : [];
    };

    // Validate sceneIds and recompute occurrenceCount from ground truth — never trust the AI's count
    const elements = ((parsed.elements || []) as AnalyzedElement[]).map(el => {
      const confirmedSceneIds = [...new Set(
        (el.sceneIds || []).flatMap((id: string) => expandSceneId(id))
      )];
      return { ...el, sceneIds: confirmedSceneIds, occurrenceCount: confirmedSceneIds.length };
    });

    // Hard blocklist — catches generic set dressing and sub-components the AI extracts despite instructions
    // Note: "glass" is intentionally NOT a standalone block — "Magnifying Glass", "Glass Orb" are valid props.
    // Only compound phrases that are clearly sub-components are blocked.
    // Biological body parts are listed separately — they should be reclassified as the whole creature (character).
    const PART_WORDS = /\b(porthole|panel|dashboard|gauge|lever|screen|monitor|dial|switch|button|seat|window|door|hatch|engine|spotlight|headlight|antenna|cable|pipe|valve|vent|hull|deck|railing|ladder|console|cockpit|interior|cabin|aquarium glass|tank glass|fish tank|water tank|observation glass|computer|laptop|keyboard|mouse|workstation|desk|table|chair|shelf|shelving|rack|cabinet|filing|locker|lamp|light fixture|bulb|corridor|hallway|staircase|room|area|zone|space|section|bay|duct|wiring|floor|ceiling|wall|beam|pillar|column|strut|bracket|mount|hinge|bolt|screw|nozzle|grip|trigger|barrel|blade|tip)\b/i;
    // Body parts of living creatures — these should be the whole creature (character), not a prop
    const CREATURE_PART_WORDS = /\b(eye|eyes|claw|claws|tentacle|tentacles|paw|paws|wing|wings|fin|fins|tail|jaw|jaws|fang|fangs|talon|talons|limb|limbs|appendage|appendages|beak|hoof|hooves|horn|horns|tusk|tusks|maw|snout|hide|scales|feather|feathers)\b/i;
    const GROUP_WORDS = /^(crew|crowd|people|figures|team|soldiers|group|extras|bystanders|villagers|citizens|passengers|workers|guards|staff|personnel|audience|spectators|onlookers|residents|inhabitants)\b/i;
    // Generic / vague nouns that are never worth a standalone reference image
    const VAGUE_WORDS = /^(equipment|apparatus|device|technology|machinery|instruments|tools|materials|supplies|contents|items|objects|things|stuff|elements|components|parts|features|details)\b/i;

    const filtered = elements.filter(el => {
      if (!el.name || !el.description || el.description.length < 20 || el.sceneIds.length === 0) return false;

      // Block groups/unnamed extras for characters
      if (el.type === "character" && GROUP_WORDS.test(el.name)) return false;

      // Block parts, set dressing, sub-components for props and environments
      if (el.type === "prop" || el.type === "environment") {
        if (PART_WORDS.test(el.name)) return false;
        if (VAGUE_WORDS.test(el.name)) return false;
        // Block biological body parts classified as props — these should be whole creatures (characters)
        if (el.type === "prop" && CREATURE_PART_WORDS.test(el.name)) return false;
      }

      // Characters: always keep. Environments: 2+ scenes. Props: stricter — 3+ scenes OR marked primary.
      if (el.type === "character") return true;
      if (el.type === "environment") return el.occurrenceCount >= 2 || el.sceneIds.length >= 2;
      // Props must be genuinely recurring hero objects
      return (el.occurrenceCount >= 3 || el.sceneIds.length >= 3) || el.importance === "primary";
    });

    // Dedup pass 1: if a parent name is a prefix of a child name (e.g. "Submarine" → "Submarine Porthole"), remove child
    const names = filtered.map(e => e.name.toLowerCase());
    let deduped = filtered.filter(el => {
      const lower = el.name.toLowerCase();
      return !names.some(other => other !== lower && lower.startsWith(other + " "));
    });

    // Dedup pass 2: remove elements whose name is a keyword found inside an extracted environment name
    // e.g. environment="Aquarium Research Center" → drop prop="Fish Tank", prop="Research Computer"
    const envNames = deduped.filter(e => e.type === "environment").map(e => e.name.toLowerCase());
    if (envNames.length > 0) {
      deduped = deduped.filter(el => {
        if (el.type === "environment") return true;
        const lower = el.name.toLowerCase();
        // Drop if every word in this element's name appears in any environment name (it's a sub-feature)
        for (const envName of envNames) {
          const elWords = lower.split(/\s+/).filter(w => w.length > 3);
          if (elWords.length > 0 && elWords.every(w => envName.includes(w))) return false;
        }
        return true;
      });
    }
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
