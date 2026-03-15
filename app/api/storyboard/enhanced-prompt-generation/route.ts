import { NextRequest, NextResponse } from 'next/server';

interface VisualConsistencyRules {
  perspective: string;
  lighting: string;
  atmosphere: string;
  continuity: string[];
  quality: string[];
}

interface ElementContext {
  name: string;
  type: 'character' | 'environment' | 'prop';
  visualTraits: {
    height?: string;
    scale?: string;
    perspective?: string;
    lighting?: string;
    atmosphere?: string;
  };
  scenes: number[];
}

interface EnhancedPromptRequest {
  basePrompt: string;
  sceneNumber: number;
  elements: ElementContext[];
  visualStyle: {
    lighting: string;
    perspective: string;
    atmosphere: string;
  };
  duration: number;
  camera: string;
}

interface EnhancedPromptResponse {
  enhancedPrompt: string;
  visualConsistency: VisualConsistencyRules;
  elementIntegration: {
    [elementName: string]: string;
  };
  technicalSpecs: {
    aspectRatio: string;
    quality: string;
    style: string;
  };
  animationNotes: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { basePrompt, sceneNumber, elements, visualStyle, duration, camera }: EnhancedPromptRequest = await request.json();

    if (!basePrompt) {
      return NextResponse.json(
        { error: 'Base prompt is required' },
        { status: 400 }
      );
    }

    // Generate enhanced prompt with visual consistency
    const enhancedPrompt = generateEnhancedPrompt(basePrompt, sceneNumber, elements, visualStyle, duration, camera);
    
    return NextResponse.json({
      success: true,
      ...enhancedPrompt
    });

  } catch (error) {
    console.error('Enhanced prompt generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced prompt' },
      { status: 500 }
    );
  }
}

function generateEnhancedPrompt(
  basePrompt: string,
  sceneNumber: number,
  elements: ElementContext[],
  visualStyle: { lighting: string; perspective: string; atmosphere: string },
  duration: number,
  camera: string
): EnhancedPromptResponse {
  
  // 1. Base visual consistency rules
  const visualConsistency = applyVisualConsistencyRules(visualStyle, duration);
  
  // 2. Integrate elements with context
  const elementIntegration = integrateElementsIntoPrompt(elements, sceneNumber);
  
  // 3. Build enhanced prompt
  const enhancedPrompt = buildEnhancedPrompt(basePrompt, elementIntegration, visualConsistency);
  
  // 4. Generate technical specifications
  const technicalSpecs = generateTechnicalSpecs(duration, camera);
  
  // 5. Create animation notes
  const animationNotes = generateAnimationNotes(duration, camera, elements);

  return {
    enhancedPrompt,
    visualConsistency,
    elementIntegration,
    technicalSpecs,
    animationNotes,
  };
}

function applyVisualConsistencyRules(
  visualStyle: { lighting: string; perspective: string; atmosphere: string },
  duration: number
): VisualConsistencyRules {
  
  const baseRules: VisualConsistencyRules = {
    perspective: determinePerspective(visualStyle.perspective, duration),
    lighting: determineLightingStyle(visualStyle.lighting, duration),
    atmosphere: determineAtmosphere(visualStyle.atmosphere, duration),
    continuity: generateContinuityElements(visualStyle),
    quality: generateQualityElements(duration),
  };

  return baseRules;
}

function determinePerspective(perspective: string, duration: number): string {
  if (duration >= 6) return 'epic wide cinematic perspective';
  if (duration >= 4) return 'dramatic medium shot perspective';
  if (perspective === 'close-up') return 'intimate close-up perspective';
  if (perspective === 'wide') return 'expansive wide-angle perspective';
  return 'balanced cinematic perspective';
}

function determineLightingStyle(lighting: string, duration: number): string {
  const baseLighting = {
    'cinematic': 'cinematic short-film lighting',
    'dramatic': 'dramatic cinematic lighting',
    'mysterious': 'mysterious atmospheric lighting',
    'volumetric': 'volumetric cinematic lighting',
  };

  const lightingStyle = baseLighting[lighting as keyof typeof baseLighting] || 'cinematic lighting';
  
  // Add duration-based lighting adjustments
  if (duration >= 6) {
    return `${lightingStyle}, deep shadow contrast, atmospheric depth`;
  } else if (duration <= 4) {
    return `${lightingStyle}, focused illumination, high contrast`;
  }
  
  return `${lightingStyle}, balanced illumination, natural shadows`;
}

function determineAtmosphere(atmosphere: string, duration: number): string {
  const baseAtmosphere = {
    'mysterious': 'mysterious suspenseful atmosphere',
    'suspenseful': 'tense suspenseful atmosphere',
    'dramatic': 'intense dramatic atmosphere',
    'terrifying': 'terrifying ominous atmosphere',
    'neutral': 'balanced cinematic atmosphere',
  };

  const atmosphereStyle = baseAtmosphere[atmosphere as keyof typeof baseAtmosphere] || 'cinematic atmosphere';
  
  // Add environmental effects
  const environmentalEffects = [
    'room haze particles',
    'water particles floating',
    'atmospheric depth',
    'volumetric effects',
  ];

  return `${atmosphereStyle}, ${environmentalEffects.join(', ')}`;
}

function generateContinuityElements(visualStyle: { lighting: string; perspective: string; atmosphere: string }): string[] {
  const continuityElements = [
    'clear perspective',
    'cinematic short-film lighting',
    'environment continuity',
    'height/scale control',
    'softness + film grain',
  ];

  // Add style-specific continuity
  if (visualStyle.lighting === 'mysterious') {
    continuityElements.push('consistent mysterious lighting');
  }
  if (visualStyle.atmosphere === 'suspenseful') {
    continuityElements.push('suspenseful atmosphere continuity');
  }

  return continuityElements;
}

function generateQualityElements(duration: number): string[] {
  const baseQuality = [
    'ultra realistic',
    '8k detail',
    'cinematic film still',
    'professional photography',
  ];

  // Add duration-specific quality
  if (duration >= 6) {
    baseQuality.push('masterpiece quality', 'award-winning cinematography');
  } else if (duration <= 4) {
    baseQuality.push('high detail', 'sharp focus');
  }

  return baseQuality;
}

function integrateElementsIntoPrompt(elements: ElementContext[], sceneNumber: number): { [elementName: string]: string } {
  const integration: { [elementName: string]: string } = {};

  elements.forEach(element => {
    if (element.scenes.includes(sceneNumber)) {
      integration[element.name] = generateElementPrompt(element);
    }
  });

  return integration;
}

function generateElementPrompt(element: ElementContext): string {
  let prompt = '';

  switch (element.type) {
    case 'character':
      prompt = generateCharacterPrompt(element);
      break;
    case 'environment':
      prompt = generateEnvironmentPrompt(element);
      break;
    case 'prop':
      prompt = generatePropPrompt(element);
      break;
  }

  return prompt;
}

function generateCharacterPrompt(element: ElementContext): string {
  let prompt = element.name;

  // Add visual traits
  if (element.visualTraits.height) {
    prompt += `, ${element.visualTraits.height} scale`;
  }
  if (element.visualTraits.lighting) {
    prompt += `, ${element.visualTraits.lighting}`;
  }
  if (element.visualTraits.atmosphere) {
    prompt += `, ${element.visualTraits.atmosphere} presence`;
  }

  // Add character-specific details
  if (element.name.toLowerCase().includes('sea monster')) {
    prompt += ', colossal terrifying sea monster, glowing eyes, ancient appearance, massive scale';
  }
  if (element.name.toLowerCase().includes('scientist')) {
    prompt += ', professional research scientist, laboratory attire, focused expression';
  }

  return prompt;
}

function generateEnvironmentPrompt(element: ElementContext): string {
  let prompt = element.name;

  // Add environmental traits
  if (element.visualTraits.lighting) {
    prompt += `, ${element.visualTraits.lighting} environment`;
  }
  if (element.visualTraits.atmosphere) {
    prompt += `, ${element.visualTraits.atmosphere} atmosphere`;
  }
  if (element.visualTraits.perspective) {
    prompt += `, ${element.visualTraits.perspective} view`;
  }

  // Add environment-specific details
  if (element.name.toLowerCase().includes('deep ocean')) {
    prompt += ', dark deep ocean abyss, mysterious underwater environment, blue filtered light';
  }
  if (element.name.toLowerCase().includes('research facility')) {
    prompt += ', advanced research facility, high-tech environment, scientific equipment';
  }

  return prompt;
}

function generatePropPrompt(element: ElementContext): string {
  let prompt = element.name;

  // Add prop traits
  if (element.visualTraits.scale) {
    prompt += `, ${element.visualTraits.scale} prop`;
  }
  if (element.visualTraits.lighting) {
    prompt += `, ${element.visualTraits.lighting} effect`;
  }

  // Add prop-specific details
  if (element.name.toLowerCase().includes('sonar')) {
    prompt += ', advanced sonar monitoring equipment, glowing screens, data visualization';
  }
  if (element.name.toLowerCase().includes('glass')) {
    prompt += ', reinforced glass barrier, transparent containment, stress fractures';
  }

  return prompt;
}

function buildEnhancedPrompt(
  basePrompt: string,
  elementIntegration: { [elementName: string]: string },
  visualConsistency: VisualConsistencyRules
): string {
  
  // Start with base prompt
  let enhancedPrompt = basePrompt;

  // Add elements
  const elementDescriptions = Object.values(elementIntegration);
  if (elementDescriptions.length > 0) {
    enhancedPrompt += `, ${elementDescriptions.join(', ')}`;
  }

  // Add visual consistency
  enhancedPrompt += `, ${visualConsistency.perspective}`;
  enhancedPrompt += `, ${visualConsistency.lighting}`;
  enhancedPrompt += `, ${visualConsistency.atmosphere}`;
  enhancedPrompt += `, ${visualConsistency.continuity.join(', ')}`;
  enhancedPrompt += `, ${visualConsistency.quality.join(', ')}`;

  // Add final cinematic touches
  enhancedPrompt += `, dramatic shadows, volumetric light rays, softness + film grain, accurate location context`;

  return enhancedPrompt;
}

function generateTechnicalSpecs(duration: number, camera: string): { aspectRatio: string; quality: string; style: string } {
  const aspectRatio = duration >= 6 ? '16:9' : '16:9';
  const quality = duration >= 6 ? 'ultra-high quality' : 'high quality';
  const style = 'cinematic photography';

  return {
    aspectRatio,
    quality,
    style,
  };
}

function generateAnimationNotes(duration: number, camera: string, elements: ElementContext[]): string[] {
  const notes: string[] = [];

  // Duration-based animation notes
  if (duration >= 6) {
    notes.push('Slow cinematic reveal, gradual focus pull');
  } else if (duration <= 4) {
    notes.push('Quick impactful shot, immediate focus');
  } else {
    notes.push('Balanced pacing, natural movement');
  }

  // Camera-specific notes
  if (camera.includes('zoom')) {
    notes.push('Smooth zoom transition, maintain depth of field');
  }
  if (camera.includes('close-up')) {
    notes.push('Shallow depth of field, background blur');
  }
  if (camera.includes('wide')) {
    notes.push('Deep focus, maintain sharpness across frame');
  }

  // Element-specific animation notes
  elements.forEach(element => {
    if (element.type === 'character' && element.visualTraits.lighting === 'glowing eyes') {
      notes.push(`${element.name}: subtle eye glow animation, breathing effect`);
    }
    if (element.type === 'environment' && element.visualTraits.atmosphere?.includes('particles')) {
      notes.push(`Environment: floating particle animation, atmospheric movement`);
    }
  });

  return notes;
}

// Helper function for batch processing multiple scenes
export async function POST_batch(request: NextRequest) {
  try {
    const { scenes } = await request.json();

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: 'Scenes array is required' },
        { status: 400 }
      );
    }

    const enhancedScenes = scenes.map(scene => 
      generateEnhancedPrompt(
        scene.basePrompt,
        scene.sceneNumber,
        scene.elements || [],
        scene.visualStyle || { lighting: 'cinematic', perspective: 'standard', atmosphere: 'neutral' },
        scene.duration || 4,
        scene.camera || 'standard'
      )
    );

    return NextResponse.json({
      success: true,
      enhancedScenes,
      summary: {
        totalScenes: scenes.length,
        totalDuration: scenes.reduce((sum, scene) => sum + (scene.duration || 4), 0),
        averageConfidence: enhancedScenes.reduce((sum, scene) => sum + 1, 0) / enhancedScenes.length,
      }
    });

  } catch (error) {
    console.error('Batch enhanced prompt generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate batch enhanced prompts' },
      { status: 500 }
    );
  }
}
