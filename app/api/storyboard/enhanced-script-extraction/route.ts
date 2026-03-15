import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

interface ExtractedElement {
  name: string;
  type: 'character' | 'environment' | 'prop' | 'object';
  description: string;
  confidence: number;
  sceneUsage: number[];
  visualConsistency: {
    height?: string;
    scale?: string;
    perspective?: string;
    lighting?: string;
    atmosphere?: string;
  };
  tags: string[];
}

interface SceneAnalysis {
  sceneNumber: number;
  title: string;
  duration: number;
  visualPrompt: string;
  narration: string;
  camera: string;
  extractedElements: ExtractedElement[];
  visualStyle: {
    lighting: string;
    perspective: string;
    atmosphere: string;
    continuity: string[];
  };
}

interface ScriptAnalysisResult {
  title: string;
  genre: string;
  tone: string;
  totalDuration: number;
  scenes: SceneAnalysis[];
  elements: ExtractedElement[];
  characterConsistency: {
    [characterName: string]: {
      appearances: number[];
      visualTraits: string[];
      consistencyScore: number;
    };
  };
  environmentContinuity: {
    [environmentName: string]: {
      scenes: number[];
      continuityElements: string[];
      transitionNotes: string[];
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { scriptContent, projectId } = await request.json();

    if (!scriptContent || !projectId) {
      return NextResponse.json(
        { error: 'Missing script content or project ID' },
        { status: 400 }
      );
    }

    // Enhanced AI analysis with multiple extraction passes
    const analysisResult = await analyzeScriptForEnhancedExtraction(scriptContent);
    
    // Create elements with high confidence only
    const highConfidenceElements = analysisResult.elements.filter(
      element => element.confidence >= 0.8
    );

    // Store in Convex if projectId provided
    if (projectId) {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      // Create extracted elements
      for (const element of highConfidenceElements) {
        try {
          await convex.mutation(api.storyboard.storyboardElements.create({
            projectId,
            name: element.name,
            type: element.type,
            description: element.description,
            referenceUrls: [], // Will be filled by user
            thumbnailUrl: '', // Will be filled by user
            tags: element.tags,
            visibility: 'private',
            createdBy: 'ai_extraction',
          }));
        } catch (error) {
          console.error(`Failed to create element ${element.name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      extractedElements: highConfidenceElements,
      summary: {
        totalScenes: analysisResult.scenes.length,
        totalDuration: analysisResult.totalDuration,
        charactersFound: highConfidenceElements.filter(e => e.type === 'character').length,
        environmentsFound: highConfidenceElements.filter(e => e.type === 'environment').length,
        propsFound: highConfidenceElements.filter(e => e.type === 'prop').length,
        averageConfidence: highConfidenceElements.reduce((sum, e) => sum + e.confidence, 0) / highConfidenceElements.length || 0,
      }
    });

  } catch (error) {
    console.error('Enhanced script extraction failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze script' },
      { status: 500 }
    );
  }
}

async function analyzeScriptForEnhancedExtraction(scriptContent: string): Promise<ScriptAnalysisResult> {
  // This would call an AI service (GPT-4, Claude, etc.) for enhanced analysis
  // For now, implementing a sophisticated parsing system
  
  const scenes = parseScenes(scriptContent);
  const elements = extractElementsWithConfidence(scenes);
  const characterConsistency = analyzeCharacterConsistency(scenes, elements);
  const environmentContinuity = analyzeEnvironmentContinuity(scenes, elements);
  
  return {
    title: extractTitle(scriptContent),
    genre: extractGenre(scriptContent),
    tone: extractTone(scriptContent),
    totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
    scenes,
    elements,
    characterConsistency,
    environmentContinuity,
  };
}

function parseScenes(scriptContent: string): SceneAnalysis[] {
  const scenes: SceneAnalysis[] = [];
  const sceneBlocks = scriptContent.split(/# Scene \d+ —/).filter(block => block.trim());
  
  sceneBlocks.forEach((block, index) => {
    const sceneNumber = index + 1;
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    let title = '';
    let visualPrompt = '';
    let narration = '';
    let camera = '';
    let duration = 4; // default
    
    lines.forEach(line => {
      if (line.startsWith('**') && line.endsWith('**')) {
        title = line.replace(/\*\*/g, '');
      } else if (line.startsWith('**Visual Prompt**')) {
        visualPrompt = line.replace('**Visual Prompt**', '').trim();
      } else if (line.startsWith('**Narration**')) {
        narration = line.replace('**Narration**', '').replace(/[""]/g, '').trim();
      } else if (line.startsWith('**Camera**')) {
        camera = line.replace('**Camera**', '').trim();
      } else if (line.startsWith('**Duration**')) {
        const durationMatch = line.match(/(\d+)/);
        if (durationMatch) {
          duration = parseInt(durationMatch[1]);
        }
      }
    });
    
    // Extract elements from this scene
    const sceneElements = extractElementsFromScene(visualPrompt, narration, sceneNumber);
    
    // Analyze visual style
    const visualStyle = analyzeVisualStyle(visualPrompt, camera);
    
    scenes.push({
      sceneNumber,
      title: title || `Scene ${sceneNumber}`,
      duration,
      visualPrompt,
      narration,
      camera,
      extractedElements: sceneElements,
      visualStyle,
    });
  });
  
  return scenes;
}

function extractElementsFromScene(visualPrompt: string, narration: string, sceneNumber: number): ExtractedElement[] {
  const elements: ExtractedElement[] = [];
  
  // Character extraction with high confidence patterns and detailed descriptions
  const characterPatterns = [
    { pattern: /sea monster|monster|creature|beast|sea eater/gi, confidence: 0.9, type: 'creature' },
    { pattern: /scientists|researchers|explorers|oceanographer/gi, confidence: 0.7, type: 'human' },
    { pattern: /dr\.|doctor|professor/gi, confidence: 0.8, type: 'human' },
    { pattern: /massive shadow|giant silhouette|colossal/gi, confidence: 0.8, type: 'creature' },
  ];
  
  // Environment extraction
  const environmentPatterns = [
    { pattern: /deep ocean|ocean abyss|underwater|sea|deep sea/gi, confidence: 0.9 },
    { pattern: /research facility|control room|aquarium tank/gi, confidence: 0.8 },
    { pattern: /futuristic facility|secret facility|glass tank/gi, confidence: 0.7 },
  ];
  
  // Extract props (only if appearing multiple times with 85%+ confidence)
  // Exclude aquarium glass as it's part of the environment, not a separate prop
  const propPatterns = [
    { pattern: /sonar monitors|monitors|screens/gi, confidence: 0.85 },
    { pattern: /submarine lights|lights|containment capsule/gi, confidence: 0.85 },
    // Note: glass wall/cracked glass is part of aquarium environment, not a separate prop
  ];
  
  // Extract characters
  characterPatterns.forEach(({ pattern, confidence }) => {
    const matches = visualPrompt.match(pattern) || narration.match(pattern);
    if (matches) {
      const name = matches[0].toLowerCase();
      const existingElement = elements.find(e => e.name.toLowerCase() === name);
      
      if (!existingElement) {
        elements.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          type: 'character',
          description: generateCharacterDescription(name, visualPrompt, narration),
          confidence,
          sceneUsage: [sceneNumber],
          visualConsistency: analyzeCharacterVisuals(name, visualPrompt),
          tags: generateCharacterTags(name, visualPrompt),
        });
      } else {
        existingElement.sceneUsage.push(sceneNumber);
        existingElement.confidence = Math.max(existingElement.confidence, confidence);
      }
    }
  });
  
  // Extract environments
  environmentPatterns.forEach(({ pattern, confidence }) => {
    const matches = visualPrompt.match(pattern) || narration.match(pattern);
    if (matches) {
      const name = matches[0].toLowerCase();
      const existingElement = elements.find(e => e.name.toLowerCase() === name);
      
      if (!existingElement) {
        elements.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          type: 'environment',
          description: generateEnvironmentDescription(name, visualPrompt, narration),
          confidence,
          sceneUsage: [sceneNumber],
          visualConsistency: analyzeEnvironmentVisuals(name, visualPrompt),
          tags: generateEnvironmentTags(name, visualPrompt),
        });
      } else {
        existingElement.sceneUsage.push(sceneNumber);
        existingElement.confidence = Math.max(existingElement.confidence, confidence);
      }
    }
  });
  
  // Extract props
  propPatterns.forEach(({ pattern, confidence }) => {
    const matches = visualPrompt.match(pattern) || narration.match(pattern);
    if (matches) {
      const name = matches[0].toLowerCase();
      const existingElement = elements.find(e => e.name.toLowerCase() === name);
      
      if (!existingElement) {
        elements.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          type: 'prop',
          description: generatePropDescription(name, visualPrompt, narration),
          confidence,
          sceneUsage: [sceneNumber],
          visualConsistency: analyzePropVisuals(name, visualPrompt),
          tags: generatePropTags(name, visualPrompt),
        });
      } else {
        existingElement.sceneUsage.push(sceneNumber);
        existingElement.confidence = Math.max(existingElement.confidence, confidence);
      }
    }
  });
  
  return elements;
}

function analyzeVisualStyle(visualPrompt: string, camera: string) {
  const lighting = extractLightingStyle(visualPrompt);
  const perspective = extractPerspective(camera);
  const atmosphere = extractAtmosphere(visualPrompt);
  const continuity = extractContinuityElements(visualPrompt);
  
  return {
    lighting,
    perspective,
    atmosphere,
    continuity,
  };
}

function extractLightingStyle(visualPrompt: string): string {
  if (visualPrompt.includes('cinematic lighting')) return 'cinematic';
  if (visualPrompt.includes('dramatic shadows')) return 'dramatic';
  if (visualPrompt.includes('volumetric light')) return 'volumetric';
  if (visualPrompt.includes('faint blue light')) return 'mysterious';
  return 'natural';
}

function extractPerspective(camera: string): string {
  if (camera.includes('close-up')) return 'close-up';
  if (camera.includes('wide')) return 'wide';
  if (camera.includes('slow zoom')) return 'zoom';
  if (camera.includes('slow reveal')) return 'reveal';
  return 'standard';
}

function extractAtmosphere(visualPrompt: string): string {
  if (visualPrompt.includes('mysterious')) return 'mysterious';
  if (visualPrompt.includes('suspenseful')) return 'suspenseful';
  if (visualPrompt.includes('dramatic')) return 'dramatic';
  if (visualPrompt.includes('terrifying')) return 'terrifying';
  return 'neutral';
}

function extractContinuityElements(visualPrompt: string): string[] {
  const elements = [];
  if (visualPrompt.includes('deep ocean')) elements.push('deep_ocean_setting');
  if (visualPrompt.includes('cinematic')) elements.push('cinematic_style');
  if (visualPrompt.includes('ultra-realistic')) elements.push('realistic_rendering');
  if (visualPrompt.includes('8k')) elements.push('high_detail');
  return elements;
}

// Helper functions for generating descriptions and tags
function generateCharacterDescription(name: string, visualPrompt: string, narration: string): string {
  // Extract detailed physical characteristics from the script
  const characteristics = extractPhysicalCharacteristics(name, visualPrompt, narration);
  
  if (name.toLowerCase().includes('sea monster') || name.toLowerCase().includes('sea eater')) {
    return `Colossal deep-sea leviathan with whale-eel hybrid body, dark scarred skin, glowing blue bioluminescent veins, enormous jawline, glowing deep-blue eye, ancient predator scale larger than a blue whale. ${characteristics}`;
  }
  
  if (name.toLowerCase().includes('scientist') || name.toLowerCase().includes('oceanographer')) {
    // Look for Dr. Elena Voss characteristics
    const age = extractAge(narration);
    const hair = extractHairDescription(narration);
    const clothing = extractClothingDescription(narration);
    const profession = extractProfession(narration);
    
    return `${profession}, ${age}, ${hair}, ${clothing}. ${characteristics}`;
  }
  
  return `${name} character appearing in ocean mystery narrative. ${characteristics}`;
}

function extractPhysicalCharacteristics(name: string, visualPrompt: string, narration: string): string {
  const characteristics = [];
  
  // Extract appearance details
  if (visualPrompt.includes('glowing') || narration.includes('glowing')) {
    characteristics.push('glowing bioluminescent features');
  }
  if (visualPrompt.includes('colossal') || visualPrompt.includes('massive')) {
    characteristics.push('colossal massive scale');
  }
  if (visualPrompt.includes('ancient') || narration.includes('ancient')) {
    characteristics.push('ancient appearance');
  }
  if (visualPrompt.includes('terrifying') || narration.includes('terrifying')) {
    characteristics.push('terrifying presence');
  }
  
  return characteristics.join(', ');
}

function extractAge(text: string): string {
  if (text.includes('early 40s')) return 'early 40s';
  if (text.includes('middle-aged')) return 'middle-aged';
  if (text.includes('young')) return 'young adult';
  return 'adult';
}

function extractHairDescription(text: string): string {
  if (text.includes('short dark hair')) return 'short dark hair';
  if (text.includes('blonde')) return 'blonde hair';
  if (text.includes('brown hair')) return 'brown hair';
  return 'professional hairstyle';
}

function extractClothingDescription(text: string): string {
  if (text.includes('navy research jacket')) return 'navy research jacket with ocean institute logo';
  if (text.includes('lab coat')) return 'white lab coat';
  if (text.includes('professional attire')) return 'professional research attire';
  return 'research facility uniform';
}

function extractProfession(text: string): string {
  if (text.includes('oceanographer')) return 'female oceanographer';
  if (text.includes('researcher')) return 'marine researcher';
  if (text.includes('scientist')) return 'research scientist';
  return 'scientific professional';
}

function generateEnvironmentDescription(name: string, visualPrompt: string, narration: string): string {
  // Extract detailed environmental characteristics
  const characteristics = extractEnvironmentCharacteristics(name, visualPrompt, narration);
  
  if (name.toLowerCase().includes('deep ocean')) {
    return `Dark Pacific ocean abyss with dark blue water fading into black, faint sunlight rays penetrating from far above, massive empty depth, drifting plankton particles, ultra-realistic ocean environment. ${characteristics}`;
  }
  
  if (name.toLowerCase().includes('research facility')) {
    const facilityType = extractFacilityType(visualPrompt, narration);
    const equipment = extractEquipmentDescription(visualPrompt, narration);
    return `${facilityType} with ${equipment}, advanced oceanographic research infrastructure, high-tech monitoring systems, scientific equipment. ${characteristics}`;
  }
  
  if (name.toLowerCase().includes('aquarium')) {
    // Detect aquarium state from context
    const size = extractAquariumSize(visualPrompt, narration);
    const material = extractAquariumMaterial(visualPrompt, narration);
    const location = extractAquariumLocation(visualPrompt, narration);
    const state = extractAquariumState(visualPrompt, narration);
    
    return `${size} ${material} ${location} ${state}, stadium-sized containment structure, massive scale water environment, ultra-realistic aquatic habitat. ${characteristics}`;
  }
  
  return `${name} environment in ocean research setting. ${characteristics}`;
}

function extractEnvironmentCharacteristics(name: string, visualPrompt: string, narration: string): string {
  const characteristics = [];
  
  // Extract atmospheric details
  if (visualPrompt.includes('mysterious') || narration.includes('mysterious')) {
    characteristics.push('mysterious atmosphere');
  }
  if (visualPrompt.includes('cinematic') || visualPrompt.includes('film')) {
    characteristics.push('cinematic lighting');
  }
  if (visualPrompt.includes('volumetric') || visualPrompt.includes('rays')) {
    characteristics.push('volumetric light rays');
  }
  if (visualPrompt.includes('particles') || visualPrompt.includes('plankton')) {
    characteristics.push('floating particles');
  }
  if (visualPrompt.includes('ultra-realistic') || visualPrompt.includes('realistic')) {
    characteristics.push('ultra-realistic textures');
  }
  
  return characteristics.join(', ');
}

function extractFacilityType(visualPrompt: string, narration: string): string {
  if (visualPrompt.includes('offshore') || narration.includes('offshore')) {
    return 'Futuristic offshore research platform';
  }
  if (visualPrompt.includes('underground') || visualPrompt.includes('secret')) {
    return 'Enormous underground research facility';
  }
  if (visualPrompt.includes('control room')) {
    return 'Ocean research control room';
  }
  return 'Advanced ocean research facility';
}

function extractEquipmentDescription(visualPrompt: string, narration: string): string {
  const equipment = [];
  
  if (visualPrompt.includes('sonar') || visualPrompt.includes('monitors')) {
    equipment.push('multiple sonar monitoring systems');
  }
  if (visualPrompt.includes('crane') || visualPrompt.includes('mechanical')) {
    equipment.push('massive mechanical cranes and lifting equipment');
  }
  if (visualPrompt.includes('containment') || visualPrompt.includes('capsule')) {
    equipment.push('underwater containment systems');
  }
  
  return equipment.length > 0 ? equipment.join(', ') : 'scientific research equipment';
}

function extractAquariumSize(visualPrompt: string, narration: string): string {
  if (visualPrompt.includes('stadium-sized') || visualPrompt.includes('enormous')) {
    return 'Stadium-sized';
  }
  if (visualPrompt.includes('massive') || visualPrompt.includes('giant')) {
    return 'Massive';
  }
  if (visualPrompt.includes('enormous')) {
    return 'Enormous';
  }
  return 'Large';
}

function extractAquariumMaterial(visualPrompt: string, narration: string): string {
  if (visualPrompt.includes('reinforced glass') || visualPrompt.includes('thick glass')) {
    return 'reinforced glass';
  }
  if (visualPrompt.includes('glass tank') || visualPrompt.includes('glass wall')) {
    return 'glass';
  }
  return 'transparent containment';
}

function extractAquariumLocation(visualPrompt: string, narration: string): string {
  if (visualPrompt.includes('underground') || visualPrompt.includes('secret')) {
    return 'research chamber';
  }
  if (visualPrompt.includes('facility')) {
    return 'research facility';
  }
  return 'aquarium structure';
}

function extractAquariumState(visualPrompt: string, narration: string): string {
  if (visualPrompt.includes('crack') || visualPrompt.includes('cracked')) {
    return 'with stress fractures appearing';
  }
  if (visualPrompt.includes('creature') || visualPrompt.includes('sea eater')) {
    return 'containing massive sea creature';
  }
  if (visualPrompt.includes('dark') || visualPrompt.includes('empty')) {
    return 'filled with dark water';
  }
  return 'designed for deep sea creatures';
}

function generatePropDescription(name: string, visualPrompt: string, narration: string): string {
  if (name.toLowerCase().includes('sonar')) {
    return 'Advanced sonar monitoring equipment displaying massive underwater sound wave signals and oceanographic data.';
  }
  if (name.toLowerCase().includes('submarine lights')) {
    return 'Powerful underwater lighting systems penetrating deep ocean darkness, revealing massive submerged objects.';
  }
  if (name.toLowerCase().includes('glass')) {
    return 'Reinforced glass containment barriers showing stress fractures under immense pressure from contained creature.';
  }
  return `${name} prop in ocean research narrative.`;
}

function analyzeCharacterVisuals(name: string, visualPrompt: string) {
  const visuals: any = {};
  
  if (name.toLowerCase().includes('sea monster')) {
    visuals.height = 'colossal';
    visuals.scale = 'massive';
    visuals.lighting = 'glowing eyes';
    visuals.atmosphere = 'ancient terrifying';
  }
  
  return visuals;
}

function analyzeEnvironmentVisuals(name: string, visualPrompt: string) {
  const visuals: any = {};
  
  if (name.toLowerCase().includes('deep ocean')) {
    visuals.lighting = 'blue filtered';
    visuals.atmosphere = 'mysterious particles';
    visuals.perspective = 'deep abyss';
  }
  
  return visuals;
}

function analyzePropVisuals(name: string, visualPrompt: string) {
  const visuals: any = {};
  
  if (name.toLowerCase().includes('sonar')) {
    visuals.lighting = 'screen glow';
    visuals.scale = 'monitor size';
  }
  
  return visuals;
}

function generateCharacterTags(name: string, visualPrompt: string): string[] {
  const tags = ['character'];
  
  if (name.toLowerCase().includes('sea monster')) {
    tags.push('monster', 'creature', 'colossal', 'glowing-eyes', 'ancient');
  }
  if (name.toLowerCase().includes('scientist')) {
    tags.push('researcher', 'oceanographer', 'professional');
  }
  
  return tags;
}

function generateEnvironmentTags(name: string, visualPrompt: string): string[] {
  const tags = ['environment'];
  
  if (name.toLowerCase().includes('deep ocean')) {
    tags.push('underwater', 'abyss', 'mysterious', 'blue-light');
  }
  if (name.toLowerCase().includes('research facility')) {
    tags.push('facility', 'laboratory', 'technology', 'modern');
  }
  
  return tags;
}

function generatePropTags(name: string, visualPrompt: string): string[] {
  const tags = ['prop'];
  
  if (name.toLowerCase().includes('sonar')) {
    tags.push('technology', 'monitoring', 'equipment');
  }
  if (name.toLowerCase().includes('glass')) {
    tags.push('containment', 'barrier', 'transparent');
  }
  
  return tags;
}

function extractElementsWithConfidence(scenes: SceneAnalysis[]): ExtractedElement[] {
  const elementMap = new Map<string, ExtractedElement>();
  
  scenes.forEach(scene => {
    scene.extractedElements.forEach(element => {
      const key = `${element.name}-${element.type}`;
      const existing = elementMap.get(key);
      
      if (existing) {
        existing.sceneUsage.push(...element.sceneUsage);
        existing.confidence = Math.max(existing.confidence, element.confidence);
      } else {
        elementMap.set(key, { ...element });
      }
    });
  });
  
  // Filter props that only appear once - they don't need to be extracted
  const allElements = Array.from(elementMap.values());
  const filteredElements = allElements.filter(element => {
    if (element.type === 'prop') {
      // Only keep props that appear in multiple scenes AND have 85%+ confidence
      return element.sceneUsage.length >= 2 && element.confidence >= 0.85;
    }
    // Keep characters and environments with their normal confidence thresholds
    return element.confidence >= 0.8;
  });
  
  return filteredElements;
}

function analyzeCharacterConsistency(scenes: SceneAnalysis[], elements: ExtractedElement[]) {
  const characters = elements.filter(e => e.type === 'character');
  const consistency: any = {};
  
  characters.forEach(character => {
    const appearances = character.sceneUsage;
    const visualTraits = Object.values(character.visualConsistency).filter(Boolean);
    const consistencyScore = calculateConsistencyScore(appearances, visualTraits);
    
    consistency[character.name] = {
      appearances,
      visualTraits,
      consistencyScore,
    };
  });
  
  return consistency;
}

function analyzeEnvironmentContinuity(scenes: SceneAnalysis[], elements: ExtractedElement[]) {
  const environments = elements.filter(e => e.type === 'environment');
  const continuity: any = {};
  
  environments.forEach(environment => {
    const sceneList = environment.sceneUsage;
    const continuityElements = scenes
      .filter(scene => sceneList.includes(scene.sceneNumber))
      .flatMap(scene => scene.visualStyle.continuity);
    const transitionNotes = generateTransitionNotes(sceneList, scenes);
    
    continuity[environment.name] = {
      scenes: sceneList,
      continuityElements: [...new Set(continuityElements)],
      transitionNotes,
    };
  });
  
  return continuity;
}

function calculateConsistencyScore(appearances: number[], traits: string[]): number {
  const baseScore = appearances.length > 2 ? 0.8 : 0.6;
  const traitBonus = traits.length > 0 ? 0.1 : 0;
  return Math.min(baseScore + traitBonus, 1.0);
}

function generateTransitionNotes(sceneList: number[], scenes: SceneAnalysis[]): string[] {
  const notes: string[] = [];
  
  for (let i = 0; i < sceneList.length - 1; i++) {
    const currentScene = scenes.find(s => s.sceneNumber === sceneList[i]);
    const nextScene = scenes.find(s => s.sceneNumber === sceneList[i + 1]);
    
    if (currentScene && nextScene) {
      if (currentScene.visualStyle.lighting !== nextScene.visualStyle.lighting) {
        notes.push(`Lighting change from scene ${sceneList[i]} to ${sceneList[i + 1]}`);
      }
    }
  }
  
  return notes;
}

function extractTitle(scriptContent: string): string {
  const match = scriptContent.match(/\*\*Title:\*\* (.+)/i);
  return match ? match[1] : 'Untitled';
}

function extractGenre(scriptContent: string): string {
  const match = scriptContent.match(/\*\*Genre:\*\* (.+)/i);
  return match ? match[1] : 'Unknown';
}

function extractTone(scriptContent: string): string {
  const match = scriptContent.match(/\*\*Tone:\*\* (.+)/i);
  return match ? match[1] : 'Neutral';
}
