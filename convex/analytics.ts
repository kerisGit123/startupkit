import { v } from "convex/values";
import { query } from "./_generated/server";

// Get comprehensive chatbot analytics
export const getChatbotAnalytics = query({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    timeRange: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeRanges = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - timeRanges[args.timeRange];

    // Get all conversations in time range
    const conversations = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Calculate stats
    const totalConversations = conversations.length;
    const resolvedConversations = conversations.filter(
      (c) => c.status === "resolved"
    ).length;
    const escalatedConversations = conversations.filter(
      (c) => c.status === "escalated" || c.interventionRequested
    ).length;

    const resolutionRate =
      totalConversations > 0
        ? Math.round((resolvedConversations / totalConversations) * 100)
        : 0;
    const escalationRate =
      totalConversations > 0
        ? Math.round((escalatedConversations / totalConversations) * 100)
        : 0;

    // Calculate average response time (in seconds)
    let totalResponseTime = 0;
    let responseCount = 0;
    conversations.forEach((conv) => {
      if (conv.messages.length >= 2) {
        const firstUserMsg = conv.messages.find((m) => m.role === "user");
        const firstBotMsg = conv.messages.find((m) => m.role === "assistant");
        if (firstUserMsg && firstBotMsg) {
          totalResponseTime += (firstBotMsg.timestamp - firstUserMsg.timestamp) / 1000;
          responseCount++;
        }
      }
    });
    const avgResponseTime =
      responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    // Get satisfaction scores directly from conversations (rating field)
    const satisfactionScores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalSatisfaction = 0;
    let satisfactionCount = 0;

    conversations.forEach((conv) => {
      if (conv.rating && conv.rating >= 1 && conv.rating <= 5) {
        satisfactionScores[conv.rating]++;
        totalSatisfaction += conv.rating;
        satisfactionCount++;
      }
    });

    const avgSatisfactionScore =
      satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;

    // Conversation trends (daily breakdown)
    const conversationTrends = generateDailyTrends(conversations, startTime, now);

    // Top questions (extract from messages)
    const topQuestions = extractTopQuestions(conversations);

    // Resolution breakdown
    const resolutionData = [
      { name: "Resolved by Bot", value: resolvedConversations },
      { name: "Escalated", value: escalatedConversations },
      {
        name: "Active",
        value: conversations.filter((c) => c.status === "active").length,
      },
      {
        name: "Admin Takeover",
        value: conversations.filter((c) => c.status === "admin_takeover").length,
      },
    ].filter((item) => item.value > 0);

    // Admin performance
    const adminPerformance = calculateAdminPerformance(conversations);

    return {
      stats: {
        totalConversations,
        resolutionRate,
        avgResponseTime,
        escalationRate,
        satisfactionScores,
        avgSatisfactionScore,
        conversationTrend: 0, // TODO: Calculate vs previous period
        resolutionTrend: 0,
        responseTimeTrend: 0,
        escalationTrend: 0,
      },
      conversationTrends,
      topQuestions,
      resolutionData,
      adminPerformance,
    };
  },
});

// Helper: Generate daily trends
function generateDailyTrends(
  conversations: any[],
  startTime: number,
  endTime: number
) {
  const days = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000));
  const trends = [];

  for (let i = 0; i < days; i++) {
    const dayStart = startTime + i * 24 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayConversations = conversations.filter(
      (c) => c.createdAt >= dayStart && c.createdAt < dayEnd
    );

    trends.push({
      date: new Date(dayStart).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      conversations: dayConversations.length,
      resolved: dayConversations.filter((c) => c.status === "resolved").length,
      escalated: dayConversations.filter(
        (c) => c.status === "escalated" || c.interventionRequested
      ).length,
    });
  }

  return trends;
}

// Helper: Extract top questions
function extractTopQuestions(conversations: any[]) {
  const questionMap = new Map<string, number>();

  conversations.forEach((conv) => {
    const userMessages = conv.messages.filter((m: any) => m.role === "user");
    userMessages.forEach((msg: any) => {
      const question = msg.content.trim();
      if (question.length > 10 && question.length < 200) {
        questionMap.set(question, (questionMap.get(question) || 0) + 1);
      }
    });
  });

  return Array.from(questionMap.entries())
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Helper: Calculate admin performance
function calculateAdminPerformance(conversations: any[]) {
  const adminMap = new Map<
    string,
    { conversations: number; totalResponseTime: number; count: number }
  >();

  conversations
    .filter((c) => c.takenOverBy)
    .forEach((conv) => {
      const adminId = String(conv.takenOverBy);
      const existing = adminMap.get(adminId) || {
        conversations: 0,
        totalResponseTime: 0,
        count: 0,
      };

      existing.conversations++;

      // Calculate admin response time from takeover to first admin message
      const adminMessages = conv.messages.filter((m: any) => m.role === "admin" && m.content !== "An admin has joined the conversation");
      if (adminMessages.length > 0 && conv.takenOverAt) {
        const firstAdminMsg = adminMessages[0];
        const responseTime =
          (firstAdminMsg.timestamp - conv.takenOverAt) / 1000 / 60; // minutes
        if (responseTime >= 0 && responseTime < 1440) { // Sanity check: < 24 hours
          existing.totalResponseTime += responseTime;
          existing.count++;
        }
      }

      adminMap.set(adminId, existing);
    });

  return Array.from(adminMap.entries())
    .map(([adminId, data]) => ({
      admin: `Admin ${adminId.substring(0, 6)}`,
      conversations: data.conversations,
      avgResponseTime:
        data.count > 0 ? Math.round(data.totalResponseTime / data.count) : 0,
    }))
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 10);
}

// Get real-time metrics for dashboard
export const getRealtimeMetrics = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const conversations = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.gte(q.field("createdAt"), last24h))
      .collect();

    const activeConversations = conversations.filter(
      (c) => c.status === "active" || c.status === "admin_takeover"
    ).length;

    const waitingForAgent = conversations.filter(
      (c) => c.status === "waiting_for_agent"
    ).length;

    return {
      activeConversations,
      waitingForAgent,
      totalToday: conversations.length,
    };
  },
});

// ============================================
// BUSINESS ANALYTICS
// ============================================

// Get comprehensive business dashboard metrics
export const getBusinessMetrics = query({
  args: {
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "30d";
    const now = Date.now();
    const timeRanges = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - timeRanges[timeRange];
    const previousStartTime = startTime - timeRanges[timeRange];

    // Revenue metrics
    const allTransactions = await ctx.db.query("financial_ledger").collect();
    const currentPeriodTransactions = allTransactions.filter(t => t.transactionDate >= startTime);
    const previousPeriodTransactions = allTransactions.filter(
      t => t.transactionDate >= previousStartTime && t.transactionDate < startTime
    );

    const currentRevenue = currentPeriodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const previousRevenue = previousPeriodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    // Customer metrics
    const allContacts = await ctx.db.query("contacts").collect();
    const currentPeriodContacts = allContacts.filter(c => c.createdAt >= startTime);
    const previousPeriodContacts = allContacts.filter(
      c => c.createdAt >= previousStartTime && c.createdAt < startTime
    );

    const totalCustomers = allContacts.filter(c => c.type === "customer").length;
    const newCustomers = currentPeriodContacts.filter(c => c.type === "customer").length;
    const customerGrowth = previousPeriodContacts.length > 0
      ? ((currentPeriodContacts.length - previousPeriodContacts.length) / previousPeriodContacts.length * 100).toFixed(1)
      : 0;

    // Booking metrics
    const allAppointments = await ctx.db.query("appointments").collect();
    const currentPeriodAppointments = allAppointments.filter(a => {
      const appointmentTime = new Date(a.date).getTime();
      return appointmentTime >= startTime;
    });
    const completedAppointments = currentPeriodAppointments.filter(a => a.status === "completed").length;
    const cancelledAppointments = currentPeriodAppointments.filter(a => a.status === "cancelled").length;

    // Lead metrics
    const totalLeads = allContacts.filter(c => c.type === "lead").length;
    const qualifiedLeads = allContacts.filter(c => c.lifecycleStage === "qualified").length;
    const conversionRate = totalLeads > 0 
      ? ((totalCustomers / (totalCustomers + totalLeads)) * 100).toFixed(1)
      : 0;

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: parseFloat(revenueGrowth as string),
        transactions: currentPeriodTransactions.length,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        growth: parseFloat(customerGrowth as string),
        active: allContacts.filter(c => c.status === "active").length,
      },
      bookings: {
        total: currentPeriodAppointments.length,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        completionRate: currentPeriodAppointments.length > 0
          ? ((completedAppointments / currentPeriodAppointments.length) * 100).toFixed(1)
          : 0,
      },
      leads: {
        total: totalLeads,
        qualified: qualifiedLeads,
        conversionRate: parseFloat(conversionRate as string),
      },
    };
  },
});

// Get customer lifecycle funnel
export const getCustomerFunnel = query({
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();

    return {
      prospect: contacts.filter(c => c.lifecycleStage === "prospect").length,
      qualified: contacts.filter(c => c.lifecycleStage === "qualified").length,
      customer: contacts.filter(c => c.lifecycleStage === "customer").length,
      at_risk: contacts.filter(c => c.lifecycleStage === "at_risk").length,
      churned: contacts.filter(c => c.lifecycleStage === "churned").length,
    };
  },
});
