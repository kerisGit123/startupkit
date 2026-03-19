// Example of how to use the enhanced progress system
// This demonstrates how backend functions should update task messages

// ✅ ENHANCED TASK MESSAGES WITH PROGRESS (Recommended)
const PROGRESS_EXAMPLES = {
  // Build process with 4 steps
  build: [
    "Starting build process... (1/4)",
    "Calling n8n workflow... (2/4)", 
    "Processing elements and scenes... (3/4)",
    "Generating frames... (4/4)",
    "Build completed successfully!"
  ],
  
  // Image generation with 5 steps
  image: [
    "Starting image generation... (1/5)",
    "Processing visual prompts... (2/5)",
    "Generating images... (3/5)",
    "Uploading to storage... (4/5)",
    "Finalizing results... (5/5)",
    "Images generated!"
  ],
  
  // Video generation with 3 steps
  video: [
    "Starting video generation... (1/3)",
    "Processing video frames... (2/3)",
    "Finalizing video... (3/3)",
    "Video generated!"
  ]
};

// ✅ HOW TO UPDATE TASK STATUS WITH PROGRESS
async function updateTaskWithProgress(ctx, storyboardId, step, total, type, message) {
  const progressMessage = `${message} (${step}/${total})`;
  
  await ctx.db.patch(storyboardId, {
    taskStatus: "processing",
    taskMessage: progressMessage,
    taskType: type
  });
}

// ✅ EXAMPLE USAGE IN BUILD FUNCTION
export const buildStoryboard = action({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, args) => {
    const { projectId } = args;
    
    try {
      // Step 1: Start build
      await updateTaskWithProgress(ctx, projectId, 1, 4, "script", "Starting build process");
      
      // Step 2: Call n8n
      await updateTaskWithProgress(ctx, projectId, 2, 4, "script", "Calling n8n workflow");
      const n8nResult = await callN8nWorkflow({ projectId });
      
      // Step 3: Process results
      await updateTaskWithProgress(ctx, projectId, 3, 4, "script", "Processing elements and scenes");
      await processElements(ctx, projectId, n8nResult.elements);
      await processScenes(ctx, projectId, n8nResult.scenes);
      
      // Step 4: Generate frames
      await updateTaskWithProgress(ctx, projectId, 4, 4, "script", "Generating frames");
      await generateFrames(ctx, projectId, n8nResult.scenes);
      
      // Complete
      await ctx.db.patch(projectId, {
        taskStatus: "ready",
        taskMessage: "Build completed successfully!",
        taskType: "script"
      });
      
      return { success: true };
      
    } catch (error) {
      await ctx.db.patch(projectId, {
        taskStatus: "error",
        taskMessage: "Build failed",
        taskType: "script"
      });
      throw error;
    }
  }
});

// ✅ FRONTEND WILL AUTOMATICALLY PARSE AND DISPLAY PROGRESS
// The TaskStatusWithProgress component will:
// 1. Parse "(1/4)" from taskMessage
// 2. Calculate percentage: 25%
// 3. Show progress bar with "1/4" text
// 4. Update in real-time via Convex subscriptions
