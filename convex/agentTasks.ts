import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * AI Agent task queue — stores execution plans and tracks async generation progress.
 * When Kie AI callbacks fire, tasks can be resumed.
 */

// Create a new agent task from an approved execution plan
export const createTask = mutation({
  args: {
    sessionId: v.id("director_chat_sessions"),
    projectId: v.id("storyboard_projects"),
    companyId: v.string(),
    userId: v.string(),
    steps: v.array(v.object({
      action: v.string(),
      tool: v.string(),
      frameNumber: v.optional(v.number()),
      model: v.optional(v.string()),
      credits: v.number(),
      params: v.optional(v.any()),
    })),
    totalCredits: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agent_tasks", {
      sessionId: args.sessionId,
      projectId: args.projectId,
      companyId: args.companyId,
      userId: args.userId,
      status: "approved",
      steps: args.steps.map((s) => ({
        ...s,
        status: "pending" as const,
      })),
      currentStepIndex: 0,
      totalCredits: args.totalCredits,
      creditsUsed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update task step status (e.g., when generation starts or completes)
export const updateStep = mutation({
  args: {
    taskId: v.id("agent_tasks"),
    stepIndex: v.number(),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    result: v.optional(v.string()),
    taskIdStr: v.optional(v.string()),  // Kie AI task ID
    fileId: v.optional(v.string()),     // storyboard_files ID
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const steps = [...task.steps];
    if (args.stepIndex < steps.length) {
      steps[args.stepIndex] = {
        ...steps[args.stepIndex],
        status: args.status,
        ...(args.result && { result: args.result }),
        ...(args.taskIdStr && { taskId: args.taskIdStr }),
        ...(args.fileId && { fileId: args.fileId }),
      };
    }

    // Calculate credits used from completed steps
    const creditsUsed = steps
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.credits, 0);

    // Determine overall task status
    const allDone = steps.every((s) => s.status === "completed");
    const anyFailed = steps.some((s) => s.status === "failed");
    const anyRunning = steps.some((s) => s.status === "running");

    let taskStatus = task.status;
    if (allDone) taskStatus = "completed";
    else if (anyFailed) taskStatus = "failed";
    else if (anyRunning) taskStatus = "executing";

    await ctx.db.patch(args.taskId, {
      steps,
      creditsUsed,
      status: taskStatus,
      currentStepIndex: args.stepIndex,
      updatedAt: Date.now(),
    });
  },
});

// Get active task for a session
export const getActiveTask = query({
  args: {
    sessionId: v.id("director_chat_sessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_tasks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .first();
  },
});

// Get task by ID
export const getTask = query({
  args: { taskId: v.id("agent_tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Find task that has a pending step waiting for a specific file callback
export const findTaskByFileId = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    // Look through executing/waiting tasks for a step with matching fileId
    const tasks = await ctx.db
      .query("agent_tasks")
      .withIndex("by_status")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "executing"),
          q.eq(q.field("status"), "waiting"),
        )
      )
      .collect();

    for (const task of tasks) {
      const stepIndex = task.steps.findIndex(
        (s) => s.fileId === args.fileId && s.status === "running"
      );
      if (stepIndex >= 0) {
        return { task, stepIndex };
      }
    }
    return null;
  },
});

// Cancel a task
export const cancelTask = mutation({
  args: { taskId: v.id("agent_tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

// Log analytics event
export const logAnalytics = mutation({
  args: {
    sessionId: v.optional(v.id("director_chat_sessions")),
    projectId: v.optional(v.id("storyboard_projects")),
    userId: v.optional(v.string()),
    orgId: v.optional(v.string()),
    event: v.union(
      v.literal("tool_call"),
      v.literal("correction"),
      v.literal("plan_approved"),
      v.literal("plan_rejected"),
      v.literal("generation_triggered"),
      v.literal("generation_completed"),
      v.literal("generation_failed"),
    ),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("director_analytics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
