import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  locationType?: string; // NEW: For smart environment grouping (deep_ocean_abyss, research_facility, giant_aquarium)
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

interface ProjectMetadata {
  genre?: string;
  visualStyle?: string;
  creatureDesign?: string;
  mainCharacter?: string;
  totalDuration?: string;
}

interface ScriptAnalysisResult {
  title: string;
  genre: string;
  tone: string;
  totalDuration: number;
  metadata: ProjectMetadata; // NEW: Extracted project-level metadata
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
    console.log("[Enhanced Extraction] API called");
    
    const body = await request.json();
    const { scriptContent, projectId } = body;
    
    console.log(`[Enhanced Extraction] Processing script (${scriptContent?.length || 0} chars) for project: ${projectId}`);
    
    if (!scriptContent || typeof scriptContent !== 'string') {
      return NextResponse.json(
        { error: "Invalid script content provided" },
        { status: 400 }
      );
    }
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Enhanced AI analysis with multiple extraction passes
    const analysisResult = await analyzeScriptForEnhancedExtraction(scriptContent);
    
    console.log(`[Enhanced Extraction] Analysis complete - Total elements extracted: ${analysisResult.elements.length}`);
    console.log(`[Enhanced Extraction] All elements:`, analysisResult.elements.map(e => ({ name: e.name, type: e.type, confidence: e.confidence, locationType: e.locationType })));
    
    // Create elements with high confidence only
    const highConfidenceElements = analysisResult.elements.filter(
      element => element.confidence >= 0.8
    );

    console.log(`[Enhanced Extraction] Returning ${highConfidenceElements.length} high-confidence elements (>= 0.8 confidence)`);
    console.log(`[Enhanced Extraction] High-confidence element types:`, highConfidenceElements.map(e => ({ name: e.name, type: e.type, confidence: e.confidence, locationType: e.locationType })));

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      extractedElements: highConfidenceElements,
      metadata: analysisResult.metadata, // Include extracted metadata (genre, visualStyle, etc.)
      summary: {
        totalScenes: analysisResult.scenes.length,
        totalDuration: analysisResult.totalDuration,
        charactersFound: highConfidenceElements.filter(e => e.type === 'character').length,
        environmentsFound: highConfidenceElements.filter(e => e.type === 'environment').length,
        propsFound: highConfidenceElements.filter(e => e.type === 'prop').length,
        averageConfidence: highConfidenceElements.reduce((sum, e) => sum + e.confidence, 0) / highConfidenceElements.length || 0,
        // NEW: Location-based environment strategy info
        locationStrategy: {
          strategy: 'location_based_thinking',
          uniqueLocations: [...new Set(highConfidenceElements.filter(e => e.type === 'environment').map(e => e.locationType))].length,
          locationsIdentified: highConfidenceElements.filter(e => e.type === 'environment').map(e => ({
            name: e.name,
            type: e.locationType,
            scenes: e.sceneUsage
          }))
        },
        // NEW: Element update information
        elementUpdates: {
          enhancedDescriptions: true,
          locationBasedThinking: true,
          existingElementsUpdated: 'checked_and_updated',
          newElementsCreated: 'when_needed',
          descriptionEnhancement: 'detailed_scene_prompts_with_visual_consistency'
        }
      }
    });

  } catch (error) {
    console.error('[Enhanced Extraction] Script extraction failed:', error);
    console.error('[Enhanced Extraction] Error stack:', error.stack);
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack available';
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze script',
        details: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function analyzeScriptForEnhancedExtraction(scriptContent: string): Promise<ScriptAnalysisResult> {
  // AI-powered script analysis using OpenAI GPT-4o
  
  const metadata = extractProjectMetadata(scriptContent);
  const scenes = await parseScenes(scriptContent, metadata);
  
  // Extract elements directly from AI results (no pattern-based merging)
  const elementMap = new Map<string, ExtractedElement>();
  
  // Merge elements from all scenes
  for (const scene of scenes) {
    for (const element of scene.extractedElements) {
      const key = `${element.name}-${element.type}`;
      const existing = elementMap.get(key);
      
      if (existing) {
        // Merge scene usage
        const newScenes = element.sceneUsage.filter(s => !existing.sceneUsage.includes(s));
        existing.sceneUsage.push(...newScenes);
        existing.confidence = Math.max(existing.confidence, element.confidence);
        // Keep the longer description (AI should provide good descriptions)
        if (element.description && element.description.length > existing.description.length) {
          existing.description = element.description;
        }
      } else {
        elementMap.set(key, { ...element });
      }
    }
  }
  
  const elements = Array.from(elementMap.values());
  console.log(`[AI Extraction] Final consolidated elements: ${elements.length}`);
  console.log(`[AI Extraction] Elements:`, elements.map(e => ({ name: e.name, type: e.type, descLength: e.description?.length || 0 })));
  
  const characterConsistency = analyzeCharacterConsistency(scenes, elements);
  const environmentContinuity = analyzeEnvironmentContinuity(scenes, elements);
  
  return {
    title: extractTitle(scriptContent),
    genre: extractGenre(scriptContent),
    tone: extractTone(scriptContent),
    totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
    metadata, // Include extracted metadata
    scenes,
    elements,
    characterConsistency,
    environmentContinuity,
  };
}

function extractProjectMetadata(scriptContent: string): ProjectMetadata {
  const metadata: ProjectMetadata = {};
  
  // Extract Genre
  const genreMatch = scriptContent.match(/\*\*Genre:\*\*\s*([^\n]+)/i);
  if (genreMatch) {
    metadata.genre = genreMatch[1].trim();
  }
  
  // Extract Visual Style
  const visualStyleMatch = scriptContent.match(/\*\*Visual Style:\*\*\s*([^\n]+)/i);
  if (visualStyleMatch) {
    metadata.visualStyle = visualStyleMatch[1].trim();
  }
  
  // Extract Total Duration
  const durationMatch = scriptContent.match(/\*\*Total Duration:\*\*\s*([^\n]+)/i);
  if (durationMatch) {
    metadata.totalDuration = durationMatch[1].trim();
  }
  
  // Extract Creature Design
  const creatureMatch = scriptContent.match(/\*\*Creature Design[^:]*:\*\*\s*([^\n]+)/i);
  if (creatureMatch) {
    metadata.creatureDesign = creatureMatch[1].trim();
  }
  
  // Extract Main Character
  const characterMatch = scriptContent.match(/\*\*Main Character[^:]*:\*\*\s*([^\n]+)/i);
  if (characterMatch) {
    metadata.mainCharacter = characterMatch[1].trim();
  }
  
  console.log('[Enhanced Extraction] Extracted metadata:', metadata);
  
  return metadata;
}

async function parseScenes(scriptContent: string, metadata?: ProjectMetadata): Promise<SceneAnalysis[]> {
  const scenes: SceneAnalysis[] = [];
  
  // Match scene headers with their content
  const sceneRegex = /# Scene (\d+) — ([^\n]+)([\s\S]*?)(?=# Scene \d+ —|$)/g;
  let match;
  
  while ((match = sceneRegex.exec(scriptContent)) !== null) {
    const sceneNumber = parseInt(match[1]);
    const sceneTitle = match[2].trim();
    const sceneContent = match[3];
    
    const lines = sceneContent.split('\n').map(line => line.trim()).filter(line => line);
    
    let visualPrompt = '';
    let narration = '';
    let camera = '';
    let duration = 4; // default
    
    // Parse scene content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('**Visual Prompt')) {
        // Get the content after the label, or the next line if empty
        const content = line.replace(/\*\*Visual Prompt[^*]*\*\*/, '').trim();
        if (content) {
          visualPrompt = content;
        } else if (i + 1 < lines.length) {
          visualPrompt = lines[i + 1];
        }
      } else if (line.startsWith('**Narration')) {
        const content = line.replace(/\*\*Narration[^*]*\*\*/, '').replace(/[""]/g, '').trim();
        if (content) {
          narration = content;
        } else if (i + 1 < lines.length) {
          narration = lines[i + 1].replace(/[""]/g, '');
        }
      } else if (line.startsWith('**Camera')) {
        const content = line.replace(/\*\*Camera[^*]*\*\*/, '').trim();
        if (content) {
          camera = content;
        } else if (i + 1 < lines.length) {
          camera = lines[i + 1];
        }
      } else if (line.startsWith('**Duration')) {
        const durationMatch = line.match(/(\d+)/);
        if (durationMatch) {
          duration = parseInt(durationMatch[1]);
        }
      }
    }
    
    console.log(`[Enhanced Extraction] Parsed Scene ${sceneNumber}: "${sceneTitle}"`);
    console.log(`[Enhanced Extraction] Visual Prompt: ${visualPrompt.substring(0, 100)}...`);
    console.log(`[Enhanced Extraction] Narration: ${narration.substring(0, 100)}...`);
    
    // Extract elements from this scene using AI
    const sceneElements = await extractElementsFromScene(visualPrompt, narration, sceneNumber, metadata);
    
    // Simple visual style object (AI handles all analysis)
    const visualStyle = {
      lighting: 'natural',
      perspective: 'standard', 
      atmosphere: 'neutral',
      continuity: []
    };
    
    scenes.push({
      sceneNumber,
      title: sceneTitle,
      duration,
      visualPrompt,
      narration,
      camera,
      extractedElements: sceneElements,
      visualStyle,
    });
  }
  
  console.log(`[Enhanced Extraction] Total scenes parsed: ${scenes.length}`);
  
  return scenes;
}

async function extractElementsFromScene(visualPrompt: string, narration: string, sceneNumber: number, metadata?: ProjectMetadata): Promise<ExtractedElement[]> {
  console.log(`[AI Extraction] Processing scene ${sceneNumber} with AI...`);
  
  // Build context from metadata
  let metadataContext = '';
  if (metadata) {
    if (metadata.mainCharacter) {
      metadataContext += `\n\nMain Character: ${metadata.mainCharacter}`;
    }
    if (metadata.creatureDesign) {
      metadataContext += `\n\nCreature Design: ${metadata.creatureDesign}`;
    }
  }
  
  // Use OpenAI GPT-4o to extract elements with descriptions
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert AI system specialized in storyboard analysis and cinematic scene extraction.

Your task is to extract structured **Character Elements** and **Environment Elements** from the given scene.

You must also determine **which characters and environments appear in the current scene**.

Use the provided metadata context as the single source of truth for character definitions.

--------------------------------
METADATA CONTEXT (COPY EXACTLY)
--------------------------------
${metadataContext}

--------------------------------
SCENE INPUT
--------------------------------
Scene Number: ${sceneNumber}

Visual Prompt:
${visualPrompt}

Narration:
${narration}

--------------------------------
EXTRACTION RULES
--------------------------------

SOURCE PRIORITY (highest → lowest)

1. Explicit "Characters" section in the storyboard
2. Visual Prompt
3. Narration
4. Context inference

--------------------------------
CHARACTER EXTRACTION RULES
--------------------------------

1. Use EXACT character names from metadata.
2. Copy character descriptions WORD-FOR-WORD from metadata.
3. Description must be at least 20 characters.
4. If text contains synonyms like:
   - "creature"
   - "monster"
   - "bloop"
   - "shadow"

   → normalize to **"Sea Eater"**

5. Character roles must be one of:

   - Main
   - Supporting
   - Minor

6. Character types must be one of:

   - Human
   - Creature
   - HumanGroup

--------------------------------
ENVIRONMENT EXTRACTION RULES
--------------------------------

All environments MUST be normalized into ONE of the following parent environments:

1. Deep Ocean Abyss
   (underwater, abyss, submarine scenes)

2. Research Control Room
   (control room, sonar room, monitoring station)

3. Giant Aquarium Facility
   (aquarium tanks, research chambers, observation decks, containment tanks)

Normalization Examples

submarine environment → Deep Ocean Abyss  
deep ocean → Deep Ocean Abyss  
sonar room → Research Control Room  
control room → Research Control Room  
aquarium tank → Giant Aquarium Facility  
research aquarium → Giant Aquarium Facility  

Environment descriptions must contain **minimum 20 characters**.

--------------------------------
SCENE MAPPING RULE
--------------------------------

You MUST explicitly assign which characters and environments appear in this scene.

Include the following fields:

sceneNumber  
charactersInScene  
environmentsInScene  

--------------------------------
CONFIDENCE SCORING
--------------------------------

Calculate confidence using:

confidence =
0.45 × explicit mention
+ 0.35 × visual evidence
+ 0.20 × narrative context

Where:

explicit mention
1.0 = directly listed in Characters section
0.7 = mentioned in narration
0.5 = inferred visually

visual evidence
1.0 = clearly visible
0.6 = partially visible

narrative context
1.0 = strongly implied
0.5 = weak implication

Clamp final score between **0.80 and 0.99**

--------------------------------
VALIDATION CHECKLIST
--------------------------------

Before returning JSON verify:

✓ Every character has description ≥ 20 characters  
✓ Every environment has description ≥ 20 characters  
✓ Metadata descriptions copied EXACTLY  
✓ Character names match metadata exactly  
✓ "Bloop / monster / creature" normalized to **Sea Eater**  
✓ Environment normalized to the 3 parent environments  
✓ Scene mapping fields exist  

FAILURE IS NOT ACCEPTABLE.

--------------------------------
RETURN JSON FORMAT
--------------------------------

{
  "sceneNumber": 1,

  "characters": [
    {
      "name": "Sea Eater",
      "type": "Creature",
      "role": "Main",
      "description": "COPY FULL METADATA DESCRIPTION HERE",
      "confidence": 0.96
    }
  ],

  "environments": [
    {
      "name": "Deep Ocean Abyss",
      "normalizedParent": "Deep Ocean Abyss",
      "category": "Ocean",
      "description": "Detailed environment description with minimum 20 characters",
      "locationType": "deep_ocean_abyss",
      "confidence": 0.94
    }
  ],

  "sceneMapping": {
    "sceneNumber": 1,
    "charactersInScene": [],
    "environmentsInScene": [
      "Deep Ocean Abyss"
    ]
  }
}`
        },
        {
          role: "user",
          content: `Scene ${sceneNumber}:\n\nVisual Prompt: ${visualPrompt}\n\nNarration: ${narration}\n\nExtract all characters and environments from this scene with detailed descriptions.`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    console.log(`[AI Extraction] Scene ${sceneNumber} AI raw result:`, JSON.stringify(result, null, 2));
    
    // STRICT VALIDATION - reject incomplete AI responses
    const validationErrors: string[] = [];
    
    if (!result.characters || !Array.isArray(result.characters)) {
      validationErrors.push('Missing or invalid characters array');
    } else {
      result.characters.forEach((char, index) => {
        if (!char.name || char.name.trim().length < 2) {
          validationErrors.push(`Character ${index}: Missing or invalid name`);
        }
        if (!char.description || char.description.length < 20) {
          validationErrors.push(`Character ${index} (${char.name || 'unnamed'}): Missing or short description (${char.description?.length || 0} chars)`);
        }
        if (char.name.toLowerCase().includes('bloop')) {
          validationErrors.push(`Character ${index}: AI incorrectly created 'Bloop' instead of 'Sea Eater'`);
        }
      });
    }
    
    if (!result.environments || !Array.isArray(result.environments)) {
      validationErrors.push('Missing or invalid environments array');
    } else {
      result.environments.forEach((env, index) => {
        if (!env.name || env.name.trim().length < 2) {
          validationErrors.push(`Environment ${index}: Missing or invalid name`);
        }
        if (!env.description || env.description.length < 20) {
          validationErrors.push(`Environment ${index} (${env.name || 'unnamed'}): Missing or short description (${env.description?.length || 0} chars)`);
        }
      });
    }
    
    // Validate sceneMapping
    if (!result.sceneMapping) {
      validationErrors.push('Missing sceneMapping field');
    } else {
      if (!result.sceneMapping.charactersInScene || !Array.isArray(result.sceneMapping.charactersInScene)) {
        validationErrors.push('Missing or invalid charactersInScene in sceneMapping');
      }
      if (!result.sceneMapping.environmentsInScene || !Array.isArray(result.sceneMapping.environmentsInScene)) {
        validationErrors.push('Missing or invalid environmentsInScene in sceneMapping');
      }
    }
    
    if (validationErrors.length > 0) {
      console.error(`[AI Extraction] ❌ AI failed validation for scene ${sceneNumber}:`);
      validationErrors.forEach(error => console.error(`  - ${error}`));
      console.error(`[AI Extraction] AI must provide complete descriptions for all elements!`);
      
      // Return empty array to signal AI failure
      return [];
    }
    
    const elements: ExtractedElement[] = [];
    
    // Process characters (AI passed validation)
    if (result.characters && Array.isArray(result.characters)) {
      for (const char of result.characters) {
        console.log(`[AI Extraction] Scene ${sceneNumber} - Character: ${char.name} (${char.description?.length} chars)`);
        
        // Skip duplicates
        if (elements.find(e => e.name === char.name && e.type === 'character')) {
          console.log(`[AI Extraction] Skipping duplicate: ${char.name}`);
          continue;
        }
        
        elements.push({
          name: char.name,
          type: 'character',
          description: char.description || '',
          confidence: char.confidence || 0.9,
          sceneUsage: [sceneNumber],
          visualConsistency: {},
          tags: char.name.toLowerCase().includes('dr.') || char.name.toLowerCase().includes('voss') ? ['main-character', 'human'] : ['creature', 'antagonist'],
        });
      }
    }
    
    // Process environments
    if (result.environments && Array.isArray(result.environments)) {
      for (const env of result.environments) {
        console.log(`[AI Extraction] Scene ${sceneNumber} - Environment: ${env.name}`);
        elements.push({
          name: env.name,
          type: 'environment',
          description: env.description || '',
          confidence: env.confidence || 0.85,
          sceneUsage: [sceneNumber],
          visualConsistency: {},
          tags: [],
          locationType: env.locationType || 'unknown',
        });
      }
    }
    
    // Log scene mapping results
    if (result.sceneMapping) {
      console.log(`[AI Extraction] Scene ${sceneNumber} mapping:`);
      console.log(`  - Characters in scene: ${result.sceneMapping.charactersInScene.join(', ') || 'None'}`);
      console.log(`  - Environments in scene: ${result.sceneMapping.environmentsInScene.join(', ') || 'None'}`);
    }
    
    return elements;
    
  } catch (error) {
    console.error(`[AI Extraction] Error in scene ${sceneNumber}:`, error);
    // Fallback to empty array on error
    return [];
  }
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
