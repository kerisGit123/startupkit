import { mutation } from "../_generated/server";

// Generate default custom templates for campaigns (category: custom)
export const generateDefaultCustomTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = getDefaultCustomTemplatesData();
    const results = [];
    
    for (const template of templates) {
      try {
        // Check if template already exists by name to prevent duplicates
        const existing = await ctx.db
          .query("email_templates")
          .filter((q) => q.eq(q.field("name"), template.name))
          .first();
        
        if (!existing) {
          // Create new template
          await ctx.db.insert("email_templates", {
            name: template.name,
            subject: template.subject,
            html: template.html,
            htmlBody: template.html,
            plainTextBody: "",
            variables: template.variables,
            type: "custom",
            category: "custom",
            createdBy: "system",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true,
            isDefault: false,
          });
          results.push({ name: template.name, action: "created", success: true });
        } else {
          results.push({ name: template.name, action: "skipped", success: true, message: "Already exists" });
        }
      } catch (error) {
        results.push({ 
          name: template.name, 
          action: "failed", 
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount === templates.length,
      generated: results.filter(r => r.action === "created").length,
      total: templates.length,
      results,
    };
  },
});

function getDefaultCustomTemplatesData() {
  return [
    {
      name: "Sales Announcement",
      subject: "🎉 Special Offer: {discount_percentage}% Off!",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .offer-box { background: #fef2f2; border: 2px dashed #f5576c; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
    .discount { font-size: 48px; font-weight: bold; color: #f5576c; margin: 10px 0; }
    .button { display: inline-block; padding: 16px 40px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 36px;">🎉 Limited Time Offer!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Don't miss out on this amazing deal</p>
    </div>
    <div class="content">
      <p>Hi {user_name},</p>
      <p>We're excited to offer you an exclusive discount on {product_name}!</p>
      <div class="offer-box">
        <p style="margin: 0; font-size: 18px; color: #6b7280;">Save Big With</p>
        <div class="discount">{discount_percentage}% OFF</div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Use code: <strong style="color: #f5576c;">{promo_code}</strong></p>
      </div>
      <p><strong>Offer valid until:</strong> {expiry_date}</p>
      <div style="text-align: center;">
        <a href="{shop_link}" class="button">Shop Now →</a>
      </div>
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">*Terms and conditions apply. Offer cannot be combined with other promotions.</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "product_name", "discount_percentage", "promo_code", "expiry_date", "shop_link", "company_name", "current_year"],
    },
    {
      name: "Newsletter Template",
      subject: "{company_name} Newsletter - {month} {current_year}",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .article { margin: 30px 0; padding-bottom: 30px; border-bottom: 1px solid #e5e7eb; }
    .article:last-child { border-bottom: none; }
    .article-title { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
    .read-more { color: #1e40af; text-decoration: none; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📰 {company_name} Newsletter</h1>
      <p style="margin: 10px 0 0 0;">{month} {current_year} Edition</p>
    </div>
    <div class="content">
      <p>Hi {user_name},</p>
      <p>Here's what's new this month at {company_name}!</p>
      
      <div class="article">
        <h2 class="article-title">{article_1_title}</h2>
        <p>{article_1_summary}</p>
        <a href="{article_1_link}" class="read-more">Read More →</a>
      </div>
      
      <div class="article">
        <h2 class="article-title">{article_2_title}</h2>
        <p>{article_2_summary}</p>
        <a href="{article_2_link}" class="read-more">Read More →</a>
      </div>
      
      <div class="article">
        <h2 class="article-title">{article_3_title}</h2>
        <p>{article_3_summary}</p>
        <a href="{article_3_link}" class="read-more">Read More →</a>
      </div>
      
      <p style="margin-top: 30px;">Stay tuned for more updates!</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
      <p style="font-size: 12px; margin-top: 10px;">
        <a href="{unsubscribe_link}" style="color: #6b7280;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      variables: ["company_name", "month", "current_year", "user_name", "article_1_title", "article_1_summary", "article_1_link", "article_2_title", "article_2_summary", "article_2_link", "article_3_title", "article_3_summary", "article_3_link", "unsubscribe_link"],
    },
    {
      name: "Engagement Email",
      subject: "We miss you, {user_name}! 💙",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .highlight-box { background: #f0f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">💙 We Miss You!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Come back and see what's new</p>
    </div>
    <div class="content">
      <p>Hi {user_name},</p>
      <p>We noticed you haven't visited us in a while. We've been busy making {company_name} even better!</p>
      
      <div class="highlight-box">
        <h3 style="margin-top: 0; color: #667eea;">✨ What's New:</h3>
        <ul style="margin: 10px 0;">
          <li>{feature_1}</li>
          <li>{feature_2}</li>
          <li>{feature_3}</li>
        </ul>
      </div>
      
      <p>Your account is still active and waiting for you. Come back and explore!</p>
      
      <div style="text-align: center;">
        <a href="{login_link}" class="button">Welcome Back →</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">If you have any questions or need help, just reply to this email.</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "company_name", "feature_1", "feature_2", "feature_3", "login_link", "current_year"],
    },
    {
      name: "Product Update",
      subject: "🚀 New Feature: {feature_name}",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .feature-box { background: #f0fdf4; border: 2px solid #10b981; padding: 25px; border-radius: 8px; margin: 25px 0; }
    .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 36px;">🚀 New Feature Launch!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">We've been working on something special</p>
    </div>
    <div class="content">
      <p>Hi {user_name},</p>
      <p>We're excited to announce a brand new feature: <strong>{feature_name}</strong>!</p>
      
      <div class="feature-box">
        <h3 style="margin-top: 0; color: #10b981;">✨ What's New:</h3>
        <p>{feature_description}</p>
        <h4 style="color: #10b981; margin-bottom: 10px;">Key Benefits:</h4>
        <ul>
          <li>{benefit_1}</li>
          <li>{benefit_2}</li>
          <li>{benefit_3}</li>
        </ul>
      </div>
      
      <p>This feature is available to you right now. Try it out and let us know what you think!</p>
      
      <div style="text-align: center;">
        <a href="{feature_link}" class="button">Try It Now →</a>
      </div>
      
      <p style="margin-top: 30px;">Questions? Our support team is here to help at {support_email}.</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "feature_name", "feature_description", "benefit_1", "benefit_2", "benefit_3", "feature_link", "support_email", "company_name", "current_year"],
    },
    {
      name: "Event Invitation",
      subject: "You're Invited: {event_name}",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .event-box { background: #fffbeb; border: 2px solid #f59e0b; padding: 25px; border-radius: 8px; margin: 25px 0; }
    .event-detail { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #fde68a; }
    .event-detail:last-child { border-bottom: none; }
    .button { display: inline-block; padding: 16px 40px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 36px;">🎉 You're Invited!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Join us for an exclusive event</p>
    </div>
    <div class="content">
      <p>Hi {user_name},</p>
      <p>We're thrilled to invite you to <strong>{event_name}</strong>!</p>
      
      <div class="event-box">
        <h3 style="margin-top: 0; color: #f59e0b;">📅 Event Details:</h3>
        <div class="event-detail">
          <strong>📍 Location:</strong> {event_location}
        </div>
        <div class="event-detail">
          <strong>🕐 Date & Time:</strong> {event_date} at {event_time}
        </div>
        <div class="event-detail">
          <strong>👥 Expected Attendees:</strong> {attendee_count}
        </div>
      </div>
      
      <p>{event_description}</p>
      
      <div style="text-align: center;">
        <a href="{rsvp_link}" class="button">RSVP Now →</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Please RSVP by {rsvp_deadline}. We can't wait to see you there!</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "event_name", "event_location", "event_date", "event_time", "attendee_count", "event_description", "rsvp_link", "rsvp_deadline", "company_name", "current_year"],
    },
    {
      name: "Survey Request",
      subject: "We'd love your feedback, {user_name}",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .incentive-box { background: #faf5ff; border: 2px dashed #8b5cf6; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
    .button { display: inline-block; padding: 16px 40px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">💭 Your Opinion Matters</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Help us improve {company_name}</p>
    </div>
    <div class="content">
      <p>Hi {user_name},</p>
      <p>We're always looking to improve, and your feedback is invaluable to us!</p>
      <p>Would you take {survey_duration} to share your thoughts about {survey_topic}?</p>
      
      <div class="incentive-box">
        <p style="margin: 0; font-size: 18px; color: #8b5cf6; font-weight: bold;">🎁 Complete the survey and get:</p>
        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">{incentive}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{survey_link}" class="button">Take Survey →</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">This survey will close on {survey_deadline}. Thank you for helping us serve you better!</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "company_name", "survey_duration", "survey_topic", "incentive", "survey_link", "survey_deadline", "current_year"],
    },
  ];
}
