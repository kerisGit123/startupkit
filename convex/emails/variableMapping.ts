import { Doc } from "../_generated/dataModel";

/**
 * This file shows how template variables are extracted from the database
 * and mapped to email template placeholders.
 */

// Helper function to get platform settings
export async function getPlatformSettings(ctx: any) {
  const settings = await ctx.db
    .query("platform_config")
    .filter((q: any) => q.eq(q.field("category"), "email"))
    .collect();
  
  const settingsMap: Record<string, any> = {};
  for (const setting of settings) {
    settingsMap[setting.key] = setting.value;
  }
  
  return settingsMap;
}

/**
 * Extract all template variables from user data and platform settings
 * This function shows EXACTLY where each variable comes from in the database
 */
export function buildTemplateVariables(
  user: Doc<"users">,
  platformSettings: Record<string, any>,
  customData?: Record<string, any>
): Record<string, string> {
  
  const variables: Record<string, string> = {
    // ============================================
    // USER DATA (from users table)
    // ============================================
    user_name: user.fullName || user.firstName || user.email?.split('@')[0] || "User",
    
    // ============================================
    // PLATFORM SETTINGS (from platform_config table)
    // ============================================
    company_name: platformSettings.emailFromName || "StartupKit",
    company_email: platformSettings.emailFromAddress || "support@startupkit.com",
    support_email: platformSettings.emailFromAddress || "support@startupkit.com",
    
    // ============================================
    // SYSTEM GENERATED
    // ============================================
    current_year: new Date().getFullYear().toString(),
    month: new Date().toLocaleString('default', { month: 'long' }),
    
    // ============================================
    // DYNAMIC LINKS (generated based on your app URL)
    // ============================================
    login_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.startupkit.com'}/login`,
    reset_password_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.startupkit.com'}/reset-password?token=${customData?.resetToken || 'TOKEN'}`,
    admin_dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.startupkit.com'}/admin`,
    shop_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.startupkit.com'}/shop`,
    unsubscribe_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.startupkit.com'}/unsubscribe?email=${user.email}`,
    
    // ============================================
    // SUBSCRIPTION DATA (from customData or subscription table)
    // ============================================
    invoiceNo: customData?.invoiceNo || "INV-PENDING",
    subscription_plan: customData?.subscriptionPlan || "Free Plan",
    amount: customData?.amount || "$0.00",
    subscription_status: customData?.subscriptionStatus || "Active",
    next_billing_date: customData?.nextBillingDate || "N/A",
    
    // ============================================
    // PAYMENT DATA (from customData or payment records)
    // ============================================
    payment_amount: customData?.paymentAmount || "$0.00",
    credits_purchased: customData?.creditsPurchased || "0",
    payment_date: customData?.paymentDate || new Date().toLocaleDateString(),
    payment_method: customData?.paymentMethod || "N/A",
    invoice_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.startupkit.com'}/invoices/${customData?.invoiceId || 'pending'}`,
    
    // ============================================
    // USAGE ALERT DATA (from customData or usage tracking)
    // ============================================
    usage_amount: customData?.usageAmount || "0",
    usage_limit: customData?.usageLimit || "1000",
    usage_percentage: customData?.usagePercentage || "0%",
    
    // ============================================
    // ADMIN NOTIFICATION DATA (from customData)
    // ============================================
    notification_type: customData?.notificationType || "System Alert",
    notification_priority: customData?.notificationPriority || "Medium",
    notification_time: new Date().toLocaleString(),
    notification_message: customData?.notificationMessage || "No message",
    
    // ============================================
    // CAMPAIGN-SPECIFIC DATA (from customData)
    // ============================================
    // Sales/Promotion
    product_name: customData?.productName || "Product",
    discount_percentage: customData?.discountPercentage || "10",
    promo_code: customData?.promoCode || "PROMO",
    expiry_date: customData?.expiryDate || "End of month",
    
    // Newsletter
    article_1_title: customData?.article1Title || "Latest Update",
    article_1_summary: customData?.article1Summary || "Check out our latest features...",
    article_1_link: customData?.article1Link || "#",
    article_2_title: customData?.article2Title || "Product News",
    article_2_summary: customData?.article2Summary || "New improvements are here...",
    article_2_link: customData?.article2Link || "#",
    article_3_title: customData?.article3Title || "Community Spotlight",
    article_3_summary: customData?.article3Summary || "See what our users are doing...",
    article_3_link: customData?.article3Link || "#",
    
    // Engagement
    feature_1: customData?.feature1 || "New Dashboard",
    feature_2: customData?.feature2 || "Advanced Analytics",
    feature_3: customData?.feature3 || "Team Collaboration",
    
    // Product Update
    feature_name: customData?.featureName || "New Feature",
    feature_description: customData?.featureDescription || "An amazing new feature",
    benefit_1: customData?.benefit1 || "Saves time",
    benefit_2: customData?.benefit2 || "Increases productivity",
    benefit_3: customData?.benefit3 || "Easy to use",
    feature_link: customData?.featureLink || "#",
    
    // Event
    event_name: customData?.eventName || "Upcoming Event",
    event_location: customData?.eventLocation || "Online",
    event_date: customData?.eventDate || "TBD",
    event_time: customData?.eventTime || "TBD",
    attendee_count: customData?.attendeeCount || "TBD",
    event_description: customData?.eventDescription || "Join us for an exciting event",
    rsvp_link: customData?.rsvpLink || "#",
    rsvp_deadline: customData?.rsvpDeadline || "TBD",
    
    // Survey
    survey_duration: customData?.surveyDuration || "5 minutes",
    survey_topic: customData?.surveyTopic || "your experience",
    incentive: customData?.incentive || "Thank you gift",
    survey_link: customData?.surveyLink || "#",
    survey_deadline: customData?.surveyDeadline || "End of month",
  };
  
  return variables;
}

/**
 * Replace all variables in template HTML and subject
 */
export function replaceTemplateVariables(
  html: string,
  subject: string,
  variables: Record<string, string>
): { html: string; subject: string } {
  let replacedHtml = html;
  let replacedSubject = subject;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    replacedHtml = replacedHtml.replace(regex, value);
    replacedSubject = replacedSubject.replace(regex, value);
  }
  
  return { html: replacedHtml, subject: replacedSubject };
}

/**
 * EXAMPLE USAGE:
 * 
 * // In your sendCampaign or sendEmail mutation:
 * 
 * const user = await ctx.db.get(userId);
 * const platformSettings = await getPlatformSettings(ctx);
 * 
 * // For system emails (welcome, password reset, etc.)
 * const variables = buildTemplateVariables(user, platformSettings, {
 *   resetToken: "abc123xyz",
 * });
 * 
 * // For campaign emails (newsletter, sales, etc.)
 * const variables = buildTemplateVariables(user, platformSettings, {
 *   productName: "Premium Plan",
 *   discountPercentage: "25",
 *   promoCode: "SAVE25",
 *   expiryDate: "January 31, 2026",
 * });
 * 
 * const { html, subject } = replaceTemplateVariables(
 *   template.html,
 *   template.subject,
 *   variables
 * );
 * 
 * // Now send the email with replaced content
 * await sendEmail({ to: user.email, subject, html });
 */
