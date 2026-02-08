import { query } from "../_generated/server";

export const getOverallStats = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("email_campaigns").collect();
    
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.deliveredCount || c.sentCount), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.totalRecipients, 0);

    // Get unsubscribe count
    const unsubscribes = await ctx.db.query("email_unsubscribes").collect();

    return {
      totalSent,
      totalDelivered,
      totalRecipients,
      totalCampaigns: campaigns.length,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalFailed / totalSent) * 100 : 0,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      unsubscribeCount: unsubscribes.length,
      unsubscribeRate: totalSent > 0 ? (unsubscribes.length / totalSent) * 100 : 0,
      totalOpened,
      totalClicked,
      totalFailed,
    };
  },
});

export const getTopCampaigns = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("email_campaigns")
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    return campaigns
      .map(c => ({
        ...c,
        openRate: c.sentCount > 0 ? (c.openedCount / c.sentCount) * 100 : 0,
        clickRate: c.sentCount > 0 ? (c.clickedCount / c.sentCount) * 100 : 0,
        bounceRate: c.sentCount > 0 ? (c.failedCount / c.sentCount) * 100 : 0,
        deliveryRate: c.sentCount > 0 ? ((c.deliveredCount || c.sentCount) / c.sentCount) * 100 : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 10);
  },
});

export const getCampaignBreakdown = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("email_campaigns")
      .order("desc")
      .collect();

    return campaigns.map(c => ({
      _id: c._id,
      name: c.name,
      recipients: c.totalRecipients,
      sentCount: c.sentCount,
      deliveredCount: c.deliveredCount || c.sentCount,
      openedCount: c.openedCount,
      clickedCount: c.clickedCount,
      failedCount: c.failedCount,
      openRate: c.sentCount > 0 ? (c.openedCount / c.sentCount) * 100 : 0,
      clickRate: c.sentCount > 0 ? (c.clickedCount / c.sentCount) * 100 : 0,
      bounceRate: c.sentCount > 0 ? (c.failedCount / c.sentCount) * 100 : 0,
      sentAt: c.sentAt,
      status: c.status,
    }));
  },
});

export const getPerformanceOverTime = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("email_events")
      .order("desc")
      .take(1000);

    // Group by date
    const grouped = events.reduce((acc, event) => {
      const date = new Date(event.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, sent: 0, opened: 0, clicked: 0 };
      }
      if (event.eventType === "sent") acc[date].sent++;
      if (event.eventType === "opened") acc[date].opened++;
      if (event.eventType === "clicked") acc[date].clicked++;
      return acc;
    }, {} as Record<string, { date: string; sent: number; opened: number; clicked: number }>);

    return Object.values(grouped).slice(0, 30);
  },
});
