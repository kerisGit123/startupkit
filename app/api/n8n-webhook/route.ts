import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { getAuth } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';

// Initialize Convex client for server-side use
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://healthy-mustang-liked.ngrok-free.app');
console.log('🔍 DEBUG - call here:');
export async function POST(request: NextRequest) {
  // Add CORS headers for Convex actions
  const origin = request.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('🔍 DEBUG - Incoming request:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    });
    
    const data = await request.json();
    
    console.log('🔍 DEBUG - Raw JSON received:', JSON.stringify(data, null, 2));
    console.log(' Site API received:', {
      hasProjectId: !!data.projectId,
      hasScript: !!data.script,
      hasElements: !!data.elements,
      hasScenes: !!data.scenes,
      projectId: data.projectId,
      elementsKeys: data.elements ? Object.keys(data.elements) : 'none',
      scenesCount: data.scenes ? data.scenes.length : 0,
      timestamp: new Date().toISOString()
    });
    
    // Check if this is a callback from n8n (has elements and scenes)
    if (data.elements && data.scenes) {
      console.log(' Processing n8n callback...');
      return await handleN8nCallback(data, request, corsHeaders);
    }
    
    // Check if this is a progress update from n8n (has status and message)
    if (data.status && data.message) {
      console.log(' Processing n8n progress update...');
      return await handleN8nWebhook(data, request, corsHeaders);
    }
    
    // Check if this is a frontend build request (has projectId, buildType, script)
    if (data.projectId && data.buildType && data.script) {
      console.log(' Processing frontend build request...');
      return await handleFrontendBuildRequest(data, request, corsHeaders);
    }
    
    // Otherwise, handle as generic n8n webhook
    console.log(' Processing n8n webhook request...');
    return await handleN8nWebhook(data, request, corsHeaders);
    
  } catch (error: any) {
    console.error(' Site API error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle n8n webhook without Clerk authentication
async function handleN8nWebhook(data: any, request: NextRequest, corsHeaders: Record<string, string>) {
  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  const { 
    project_id, 
    elements, 
    scenes, 
    status, 
    message,
    scriptType = "ANIMATED_STORIES",
    language = "en",
    buildStrategy = "replace_all"
  } = data;

  console.log('🔍 DEBUG: n8n webhook received:', { project_id, status, message });

  // Validate required fields
  if (!project_id) {
    return NextResponse.json(
      { error: 'Missing project_id' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Handle different webhook types
  if (status === 'processing' && message) {
    // Status update only (progress tracking)
    console.log('📊 Updating task status:', message);
    await convex.mutation(api.storyboard.projects.updateBuildStatus, {
      id: project_id,
      taskStatus: status,
      taskMessage: message,
      scriptType: scriptType,
      scenes: [], // Empty scenes for progress updates
      isAIGenerated: scriptType === "ANIMATED_STORIES"
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Status updated successfully' 
    }, { headers: corsHeaders });
  }

  if (elements && scenes) {
    // Full n8n callback with elements and scenes
    console.log('🎬 Processing n8n callback with elements and scenes');
    const result = await convex.mutation(api.storyboard.n8nWebhookCallback.n8nWebhookCallback, {
      storyboardId: project_id, // Use project_id as storyboardId
      scriptType,
      language,
      buildStrategy,
      elements,
      scenes
    });
    
    return NextResponse.json(result, { headers: corsHeaders });
  }

  // Handle simple status updates
  if (status) {
    console.log('📊 Simple status update:', status);
    await convex.mutation(api.storyboard.projects.updateBuildStatus, {
      id: project_id,
      taskStatus: status,
      taskMessage: message || 'Processing...',
      scriptType: scriptType,
      scenes: [], // Empty scenes for status updates
      isAIGenerated: scriptType === "ANIMATED_STORIES"
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Status updated successfully' 
    }, { headers: corsHeaders });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Webhook processed successfully' 
  }, { headers: corsHeaders });
}

// Handle frontend build request with Clerk authentication
async function handleFrontendBuildRequest(data: any, request: NextRequest, corsHeaders: Record<string, string>) {
  // Authenticate user with Clerk for frontend requests
  console.log('🔍 DEBUG: Checking Clerk authentication...');
  const { userId } = getAuth(request);
  console.log('🔍 DEBUG: userId:', userId);
  
  if (!userId) {
    console.error('❌ Unauthorized: No user ID found');
    return NextResponse.json(
      { success: false, error: "Unauthorized: User not authenticated" },
      { status: 401, headers: corsHeaders }
    );
  }

  // 2. Validate required fields
  console.log('🔍 DEBUG: Validating required fields...');
  console.log('🔍 DEBUG: data:', data);
  
  if (!data.projectId || !data.scriptType || !data.language || !data.buildType || !data.rebuildStrategy) {
    console.error('❌ Invalid build request - missing required fields');
    console.error('❌ Missing fields:', {
      projectId: !!data.projectId,
      scriptType: !!data.scriptType,
      language: !!data.language,
      buildType: !!data.buildType,
      rebuildStrategy: !!data.rebuildStrategy
    });
    return NextResponse.json(
      { success: false, error: "Invalid request: Missing required fields" },
      { status: 400, headers: corsHeaders }
    );
  }

  // 3. Verify user owns the project
  try {
    const project = await convex.query(api.storyboard.projects.get, { id: data.projectId });
    if (!project || project.ownerId !== userId) {
      console.error('❌ Access denied: User does not own this project');
      return NextResponse.json(
        { success: false, error: "Access denied: You don't own this project" },
        { status: 403, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('❌ Error verifying project ownership:', error);
    return NextResponse.json(
      { success: false, error: "Failed to verify project ownership" },
      { status: 500, headers: corsHeaders }
    );
  }

  // 4. Set task status in Convex
  const taskType = data.buildType === "enhanced" ? "ai_enhanced" : "normal";
  const initialMessage = data.buildType === "enhanced" 
    ? "Starting enhanced AI build..." 
    : "Starting normal build...";

  try {
    await convex.mutation(api.storyboard.build.setTaskStatus, {
      projectId: data.projectId,
      taskStatus: "processing",
      taskType: taskType,
      taskMessage: initialMessage
    });
  } catch (error) {
    console.error('❌ Error setting task status:', error);
    return NextResponse.json(
      { success: false, error: "Failed to start build process" },
      { status: 500, headers: corsHeaders }
    );
  }

  // 5. Handle rebuild strategy
  if (data.rebuildStrategy === "replace_all") {
    try {
      await convex.mutation(api.storyboard.build.clearExistingData, {
        projectId: data.projectId
      });
    } catch (error) {
      console.error('❌ Error clearing existing data:', error);
      return NextResponse.json(
        { success: false, error: "Failed to clear existing data" },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // 6. Forward to n8n
  return await forwardToN8N(data, corsHeaders);
}

// Handle n8n callback (already implemented)
async function handleN8nCallback(data: any, request: NextRequest, corsHeaders: Record<string, string>) {
  // Check if this is a progress update (has status and message but no elements/scenes)
  if (data.status && data.message && !data.elements && !data.scenes) {
    console.log('📊 Processing n8n progress update');
    
    try {
      // Initialize Convex client
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      // Update project status
      await convex.mutation(api.storyboard.projects.updateBuildStatus, {
        id: data.projectId,
        taskStatus: data.status,
        taskMessage: data.message,
        scriptType: data.scriptType || "ANIMATED_STORIES",
        scenes: [], // Empty scenes for progress updates
        isAIGenerated: data.scriptType === "ANIMATED_STORIES"
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Progress updated successfully' 
      }, { headers: corsHeaders });
      
    } catch (error: any) {
      console.error('❌ Error updating progress:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  // Otherwise, this is a full callback with elements and scenes
  // Validate required fields for callback
  if (!data.projectId || !data.elements || !data.scenes) {
    console.error('❌ Invalid callback data - missing required fields');
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid callback data: projectId, elements, and scenes are required" 
      }, 
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Validate elements structure
  if (!data.elements.characters || !data.elements.environments || !data.elements.props) {
    console.error('❌ Invalid elements structure');
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid elements structure: characters, environments, and props arrays are required" 
      }, 
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Validate authentication for callback
  const authHeader = request.headers.get('authorization');
  const expectedToken = 'n8n-webhook-secret-2024';
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== expectedToken) {
    console.error('❌ Missing or invalid authorization header for callback');
    return NextResponse.json(
      { 
        success: false, 
        error: "Unauthorized: Valid Bearer token required" 
      }, 
      { status: 401, headers: corsHeaders }
    );
  }
  
  // Save directly to Convex database
  console.log('📤 Saving elements and scenes to Convex...');
  console.log(`🔍 DEBUG: Elements to save - Characters: ${data.elements.characters?.length || 0}, Environments: ${data.elements.environments?.length || 0}, Props: ${data.elements.props?.length || 0}`);
  console.log(`🔍 DEBUG: Scenes to save: ${data.scenes?.length || 0}`);
  
  try {
    // 1. Save elements
    console.log(`🔍 DEBUG: Raw elements data:`, JSON.stringify(data.elements, null, 2));
    
    // Validate elements data structure
    if (!data.elements || typeof data.elements !== 'object') {
      throw new Error('Invalid elements data structure');
    }
    
    const allElements: { name: string; type: string; projectId: any; description: string }[] = [];
    
    // Process characters safely
    if (Array.isArray(data.elements.characters)) {
      data.elements.characters.forEach((char, index) => {
        allElements.push({
          name: typeof char === 'string' ? char : char.name || char || `Character ${index + 1}`,
          type: "character",
          projectId: data.projectId,
          description: typeof char === 'string' ? `Character: ${char}` : char.description || ''
        });
      });
    }
    
    // Process environments safely
    if (Array.isArray(data.elements.environments)) {
      data.elements.environments.forEach((env, index) => {
        allElements.push({
          name: typeof env === 'string' ? env : env.name || env || `Environment ${index + 1}`,
          type: "environment",
          projectId: data.projectId,
          description: typeof env === 'string' ? `Environment: ${env}` : env.description || ''
        });
      });
    }
    
    // Process props safely
    if (Array.isArray(data.elements.props)) {
      data.elements.props.forEach((prop, index) => {
        allElements.push({
          name: typeof prop === 'string' ? prop : prop.name || prop || `Prop ${index + 1}`,
          type: "prop",
          projectId: data.projectId,
          description: typeof prop === 'string' ? `Prop: ${prop}` : prop.description || ''
        });
      });
    }

    const savedElements: { type: string }[] = [];
    for (const element of allElements) {
      console.log(`🔍 DEBUG: Saving element: ${element.name} (${element.type})`);
      try {
        const savedElement = await convex.mutation(api.storyboard.storyboardElements.createFromN8n, {
          projectId: data.projectId,
          type: element.type,
          name: element.name,
          description: element.description,
          createdBy: data.companyId || "n8n-webhook",  // Use companyId as createdBy
          referenceUrls: [],  // Required field
          tags: [],           // Required field
          thumbnailUrl: "",   // Required field
          companyId: data.companyId || ''  // Add companyId to elements
        });
        savedElements.push(savedElement);
        console.log(`✅ DEBUG: Successfully saved element: ${element.name}`);
      } catch (saveError) {
        console.error(`❌ DEBUG: Failed to save element ${element.name}:`, saveError);
        // Continue with other elements
      }
    }

    console.log(`🔍 DEBUG: Elements saved successfully - Total: ${savedElements.length}`);
    console.log(`🔍 DEBUG: Saved elements breakdown:`, {
      characters: savedElements.filter(e => e.type === 'character').length,
      environments: savedElements.filter(e => e.type === 'environment').length,
      props: savedElements.filter(e => e.type === 'prop').length
    });

    // 2. Save scenes
    const savedScenes: any[] = [];
    
    // Validate scenes data
    if (!data.scenes || !Array.isArray(data.scenes)) {
      throw new Error('Invalid scenes data structure');
    }
    
    for (const scene of data.scenes) {
      console.log(`🔍 DEBUG: Saving scene: ${scene.title} (scene ${scene.sceneNumber})`);
      console.log(`🔍 DEBUG: Scene data:`, JSON.stringify({
        sceneId: `scene_${scene.sceneNumber}`,
        order: scene.sceneNumber,
        title: scene.title,
        duration: parseFloat(scene.duration) || 5.0,
        description: scene.description,
        generatedBy: data.companyId || "n8n-webhook",
        companyId: data.companyId || '',
        elementNames: {
          characters: scene.elements?.characters || [],
          environments: scene.elements?.environments || [],
          props: scene.elements?.props || []
        }
      }, null, 2));
      
      try {
        const savedScene = await convex.mutation(api.storyboard.storyboardItems.createFromN8n, {
          projectId: data.projectId,
          sceneId: `scene_${scene.sceneNumber}`,
          order: scene.sceneNumber,
          title: scene.title,
          duration: parseFloat(scene.duration) || 5.0,
          description: scene.description,
          generatedBy: data.companyId || "n8n-webhook", // Use companyId as generatedBy
          companyId: data.companyId || '',  // Add companyId to scenes
          elementNames: {
            characters: scene.elements?.characters || [],
            environments: scene.elements?.environments || [],
            props: scene.elements?.props || []
          }  // Add element names from n8n
        });
        savedScenes.push(savedScene);
        console.log(`✅ DEBUG: Successfully saved scene: ${scene.title}`);
      } catch (sceneError) {
        console.error(`❌ DEBUG: Failed to save scene ${scene.title}:`, sceneError);
        // Continue with other scenes
      }
    }

    console.log(`🔍 DEBUG: Scenes saved successfully - Total: ${savedScenes.length}`);

    // 3. Update project build status (without modifying script content)
    await convex.mutation(api.storyboard.projects.updateBuildStatus, {
      id: data.projectId,
      taskStatus: "ready",
      taskMessage: "Build completed successfully", // Important for user to see task status
      isAIGenerated: false,  // This is n8n processed, not AI generated
      scriptType: data.scriptType || "ANIMATED_STORIES",  // Script type from n8n
      scenes: data.scenes.map(scene => ({
        id: `scene_${scene.sceneNumber}`,
        title: scene.title,
        content: scene.description,
        characters: scene.elements?.characters || [],
        locations: scene.elements?.environments || []
      }))
    });

    const result = {
      success: true,
      message: "Elements and scenes saved successfully",
      projectId: data.projectId,
      companyId: data.companyId || '', // Show the companyId that was processed
      processed: {
        elements: {
          characters: data.elements.characters?.length || 0,
          environments: data.elements.environments?.length || 0,
          props: data.elements.props?.length || 0
        },
        scenes: data.scenes?.length || 0
      },
      saved: {
        elements: savedElements.length,
        scenes: savedScenes.length
      }
    };
    
  // Log success
    
    // Return success response
    return NextResponse.json({
      success: result.success,
      message: result.message,
      projectId: data.projectId,
      companyId: result.companyId,
      processed: result.processed,
      saved: result.saved,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders });
  
  } catch (error: any) {
    console.error('❌ Error saving to Convex:', error);
    
    // Update project status to failed
    try {
      await convex.mutation(api.storyboard.projects.updateBuildStatus, {
        id: data.projectId,
        taskStatus: "error",
        taskMessage: `Build failed: ${error.message}`, // Important for user to see error details
        isAIGenerated: false,
        scriptType: data.scriptType || "ANIMATED_STORIES",  // Script type from n8n
        scenes: []  // Empty scenes array for error case
      });
    } catch (updateError) {
      console.error('❌ Error updating project status:', updateError);
    }
    
    return NextResponse.json({
      success: false, 
      error: error.message,
      projectId: data.projectId,
      companyId: data.companyId || '',
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders });
  }
}

// Forward request to n8n
async function forwardToN8N(data: any, corsHeaders: Record<string, string>) {
  // Validate required fields for forwarding
  if (!data.projectId || !data.scriptType || !data.language) {
    console.error('❌ Invalid forwarding data - missing required fields');
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid forwarding data: projectId, scriptType, and language are required" 
      }, 
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Use script from request or fallback to Convex
  let script = data.script;
  if (!script) {
    try {
      const scriptContent = await convex.query(api.storyboard.build.getScriptContent, { projectId: data.projectId });
      script = scriptContent || "";
    } catch (error) {
      console.error('❌ Error getting script content:', error);
      return NextResponse.json(
        { success: false, error: "Failed to get script content" },
        { status: 500, headers: corsHeaders }
      );
    }
  }
  
  // Use companyId from request or fallback to Convex
  let companyId = data.companyId;
  console.log(`🔍 DEBUG: companyId from request: "${companyId}"`);
  
  if (!companyId) {
    try {
      const project = await convex.query(api.storyboard.projects.get, { id: data.projectId });
      companyId = project?.companyId || '';
      console.log(`🔍 DEBUG: companyId from project: "${companyId}"`);
    } catch (error) {
      console.error('❌ Error getting project details:', error);
      companyId = ''; // Continue without companyId if error occurs
    }
  }
  
  console.log(`🔍 DEBUG: Final companyId to send to n8n: "${companyId}"`);
  
  // Use the full n8n webhook URL directly
  const n8nWebhookUrl = process.env.N8N_SCRIPT_EXTRACTOR_WEBHOOK_PATH;
  if (!n8nWebhookUrl) {
    console.error('❌ N8N_SCRIPT_EXTRACTOR_WEBHOOK_PATH environment variable not set');
    return NextResponse.json(
      { 
        success: false, 
        error: "n8n webhook URL not configured" 
      }, 
      { status: 500, headers: corsHeaders }
    );
  }
  
  console.log('🔍 DEBUG: Using n8n webhook URL:', n8nWebhookUrl);
  
  // Prepare payload for n8n
  const n8nPayload = {
    project_id: data.projectId,
    script_type: data.scriptType,
    language: data.language,
    script: script,
    build_strategy: data.rebuildStrategy || 'add_update',
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/n8n-webhook`,
    company_id: companyId
  };
  
  console.log(`🔍 DEBUG: Sending to n8n:`, JSON.stringify(n8nPayload, null, 2));
  
  // Forward to n8n workflow
  const n8nResponse = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(n8nPayload)
  });
  
  if (!n8nResponse.ok) {
    const errorText = await n8nResponse.text();
    console.error(`❌ n8n error (${n8nResponse.status}):`, errorText);
    throw new Error(`n8n workflow error: ${n8nResponse.status} - ${errorText}`);
  }
  
  const n8nResult = await n8nResponse.json();
  console.log('✅ Successfully forwarded to n8n:', n8nResult);
  
  return NextResponse.json({
    success: true,
    message: "Request forwarded to n8n successfully",
    n8nResponse: n8nResult,
    timestamp: new Date().toISOString()
  });
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: "Method not allowed. Please use POST." 
    }, 
    { status: 405 }
  );
}
