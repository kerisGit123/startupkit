export interface ParsedScene {
  id: string;
  title: string;
  content: string;
  characters: string[];
  locations: string[];
  technical?: {
    camera: string[];
    lighting: string[];
    perspective: string[];
    action: string[];
  };
}

export function parseScriptScenes(content: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const sceneRegex = /SCENE\s+(\d+)[:\s]+([^\n]+)\n([\s\S]*?)(?=SCENE\s+\d+[:\s]|$)/gi;
  let match;

  while ((match = sceneRegex.exec(content)) !== null) {
    const [, num, title, body] = match;
    const cleanBody = body.trim();

    const charRegex = /^([A-Z][A-Z\s]{1,20}):/gm;
    const characters = [...new Set([...cleanBody.matchAll(charRegex)].map((m) => m[1].trim()))];

    const locationMatch = title.match(/[-–—]\s*(.+)$/);
    const locations = locationMatch ? [locationMatch[1].trim()] : [title.split(":")[0]?.trim() ?? "Unknown"];

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
      id: `scene-${num}`,
      title: title.trim(),
      content: cleanBody,
      characters,
      locations,
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

  return scenes;
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
