export interface ParsedScene {
  id: string;
  title: string;
  content: string;
  characters: string[];
  locations: string[];
  duration?: number; // Duration in seconds
  technical?: {
    camera: string[];
    lighting: string[];
    perspective: string[];
    action: string[];
  };
}

export interface SceneParseResult {
  scenes: ParsedScene[];
  duplicates: Array<{
    sceneNumber: string;
    title: string;
    count: number;
  }>;
  warnings: string[];
}

export function parseScriptScenes(content: string): SceneParseResult {
  const scenes: ParsedScene[] = [];
  // Match SCENE 1, SCENE 1A, SCENE 1B, SCENE 2A etc. with : or — or - or space as separator
  const sceneRegex = /SCENE\s+(\d+[A-Z]?)\s*[:\s—–-]+\s*([^\n]+)\n([\s\S]*?)(?=SCENE\s+\d+[A-Z]?\s*[:\s—–-]|$)/gi;
  let match;
  const usedSceneIds = new Set<string>();
  const duplicateScenes = new Map<string, { title: string; count: number }>();
  const warnings: string[] = [];

  while ((match = sceneRegex.exec(content)) !== null) {
    const [, sceneId, title, body] = match;
    const sceneKey = sceneId.toUpperCase();
    const sceneNumber = parseInt(sceneId);
    const cleanBody = body.trim();

    // Track duplicates by full ID (1A, 1B are different)
    if (usedSceneIds.has(sceneKey)) {
      const existing = duplicateScenes.get(sceneKey) || { title: title.trim(), count: 1 };
      duplicateScenes.set(sceneKey, { ...existing, count: existing.count + 1 });
      continue;
    }
    usedSceneIds.add(sceneKey);

    const charRegex = /^([A-Z][A-Z\s]{1,20}):/gm;
    const characters = [...new Set([...cleanBody.matchAll(charRegex)].map((m) => m[1].trim()))];

    // Also extract mentioned characters/creatures from content
    const mentionedCreatures = [
      "Kraken", "Bloop", "Sea Eater", "sea monster", "giant squid", "leviathan",
      "octopus", "whale", "shark", "dolphin", "turtle", "jellyfish"
    ];
    
    const foundCharacters = mentionedCreatures.filter(creature => 
      cleanBody.toLowerCase().includes(creature.toLowerCase())
    );
    
    // Combine both character sources
    const allCharacters = [...new Set([...characters, ...foundCharacters])];

    const locationMatch = title.match(/[-–—]\s*(.+)$/);
    const locations = locationMatch ? [locationMatch[1].trim()] : [title.split(":")[0]?.trim() ?? "Unknown"];

    // Extract duration from title (e.g., "Scene 1 — Hook (0–5s)" or "Scene 1 (5s)" or "Scene 1 — Hook (0-5s)")
    let duration: number | undefined;
    const durationMatch = title.match(/\((\d+)s\)|\((\d+)–(\d+)s\)|\((\d+)-(\d+)s\)|\((\d+)–(\d+)s\)|\((\d+)-(\d+)s\)/);
    if (durationMatch) {
      if (durationMatch[2] && durationMatch[3]) {
        // Range like (0–5s) - calculate duration as end - start
        const start = parseInt(durationMatch[2]);
        const end = parseInt(durationMatch[3]);
        duration = end - start;
      } else if (durationMatch[4] && durationMatch[5]) {
        // Range like (0-5s) - calculate duration as end - start
        const start = parseInt(durationMatch[4]);
        const end = parseInt(durationMatch[5]);
        duration = end - start;
      } else if (durationMatch[6] && durationMatch[7]) {
        // Range like (0–5s) - calculate duration as end - start
        const start = parseInt(durationMatch[6]);
        const end = parseInt(durationMatch[7]);
        duration = end - start;
      } else if (durationMatch[8] && durationMatch[9]) {
        // Range like (0-5s) - calculate duration as end - start
        const start = parseInt(durationMatch[8]);
        const end = parseInt(durationMatch[9]);
        duration = end - start;
      } else if (durationMatch[1]) {
        // Single duration like (5s)
        duration = parseInt(durationMatch[1]);
      }
    }

    const cameraKeywords = ["close-up", "wide shot", "medium shot", "aerial", "tracking", "pan", "zoom", "POV", "dolly", "tilt"];
    const lightingKeywords = ["natural light", "cinematic", "dramatic", "soft light", "backlit", "golden hour", "neon", "dark", "bright"];
    const perspectiveKeywords = ["eye-level", "high angle", "low angle", "bird's eye", "worm's eye", "over-the-shoulder"];
    const actionKeywords = ["running", "walking", "sitting", "standing", "fighting", "talking", "moving", "frozen"];

    const bodyLower = cleanBody.toLowerCase();
    const technical = {
      camera: cameraKeywords.filter((k) => bodyLower.includes(k.toLowerCase())),
      lighting: lightingKeywords.filter((k) => bodyLower.includes(k.toLowerCase())),
      perspective: perspectiveKeywords.filter((k) => bodyLower.includes(k.toLowerCase())),
      action: actionKeywords.filter((k) => bodyLower.includes(k.toLowerCase())),
    };

    scenes.push({
      id: `scene-${sceneKey.toLowerCase()}`,
      title: title.trim(),
      content: cleanBody,
      characters: allCharacters,
      locations,
      duration,
      technical,
    });
  }

  // Fallback: if no SCENE markers found, split by double newlines as scenes
  if (scenes.length === 0 && content.trim().length > 0) {
    const paragraphs = content.split(/\n{2,}/).filter((p) => p.trim().length > 20);
    paragraphs.forEach((para, i) => {
      scenes.push({
        id: `scene-${i + 1}`,
        title: `Scene ${i + 1}`,
        content: para.trim(),
        characters: [],
        locations: ["Unknown"],
      });
    });
  }

  // Final deduplication by ID to ensure unique keys
  const uniqueScenes = scenes.filter((scene, index, self) => 
    self.findIndex(s => s.id === scene.id) === index
  );

  // Convert duplicate map to array
  const duplicates = Array.from(duplicateScenes.entries()).map(([sceneNumber, data]) => ({
    sceneNumber,
    title: data.title,
    count: data.count
  }));

  // Add warnings for duplicates
  if (duplicates.length > 0) {
    warnings.push(`Found ${duplicates.length} duplicate scene(s): ${duplicates.map(d => `Scene ${d.sceneNumber}`).join(', ')}`);
  }

  return {
    scenes: uniqueScenes,
    duplicates,
    warnings
  };
}

export function scenesToStoryboardItems(
  scenes: ParsedScene[],
  projectId: string,
  userId: string
) {
  return scenes.map((scene, i) => ({
    projectId,
    sceneId: scene.id,
    order: i,
    title: scene.title,
    description: scene.content.substring(0, 300),
    duration: 5,
    generatedBy: userId,
    generationStatus: "none" as const,
  }));
}
