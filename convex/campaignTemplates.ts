import { v } from "convex/values";
import { query } from "./_generated/server";

// Campaign message templates
export const getCampaignTemplates = query({
  args: {},
  handler: async () => {
    return [
      {
        id: "sales_promotion",
        name: "Sales & Promotions",
        category: "marketing",
        subject: "🎉 Special Offer: {{discount}}% Off - Limited Time!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626; text-align: center; margin-bottom: 20px;">🎉 Special Offer Just For You!</h1>
              <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 36px;">{{discount}}% OFF</h2>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Limited Time Offer</p>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">We're excited to offer you an exclusive discount! For a limited time, enjoy <strong>{{discount}}% off</strong> on all our premium plans.</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;"><strong>Why upgrade now?</strong></p>
              <ul style="color: #374151; line-height: 1.8;">
                <li>Unlock premium features</li>
                <li>Get priority support</li>
                <li>Access exclusive content</li>
                <li>Save big with this limited offer</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Claim Your Discount</a>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">Offer expires on {{date}}. Don't miss out!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "discount", "link", "date", "company_name"],
      },
      {
        id: "product_education",
        name: "Product Education",
        category: "educational",
        subject: "📚 Master {{feature_name}} - Tips & Tricks",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb; margin-bottom: 20px;">📚 Master Our Features</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Want to get the most out of {{company_name}}? We've put together some helpful tips to help you succeed!</p>
              <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">💡 Quick Tips:</h3>
                <ul style="color: #1e40af; line-height: 1.8;">
                  <li>Tip 1: Start with the basics</li>
                  <li>Tip 2: Explore advanced features</li>
                  <li>Tip 3: Use keyboard shortcuts</li>
                  <li>Tip 4: Check out our tutorials</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Learn More</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Need help? Our support team is always here for you!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "feature_name", "link", "company_name"],
      },
      {
        id: "survey_feedback",
        name: "Survey & Feedback",
        category: "engagement",
        subject: "📝 We'd Love Your Feedback!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #7c3aed; margin-bottom: 20px;">📝 Your Opinion Matters!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">We're always working to improve {{company_name}}, and your feedback is invaluable to us!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Would you take 2 minutes to share your thoughts? Your input helps us build better features for you.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #7c3aed; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Take Survey</a>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">Takes less than 2 minutes</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Thank you for being part of our community!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "industry_news",
        name: "Industry News",
        category: "informational",
        subject: "📰 Industry Update: {{news_title}}",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #059669; margin-bottom: 20px;">📰 Industry News</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Stay informed with the latest industry trends and updates!</p>
              <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                <h3 style="color: #065f46; margin-top: 0;">What's New:</h3>
                <p style="color: #065f46; line-height: 1.6;">Latest developments in our industry that you should know about...</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #059669; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Read Full Article</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "news_title", "link", "company_name"],
      },
      {
        id: "webinar_invite",
        name: "Webinar Invites",
        category: "event",
        subject: "🎓 Join Our Webinar: {{webinar_title}}",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #ea580c; margin-bottom: 20px;">🎓 You're Invited!</h1>
              <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 24px;">{{webinar_title}}</h2>
                <p style="margin: 15px 0 0 0; font-size: 16px;">📅 {{date}}</p>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Join us for an exclusive webinar where you'll learn valuable insights and best practices!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;"><strong>What you'll learn:</strong></p>
              <ul style="color: #374151; line-height: 1.8;">
                <li>Key industry insights</li>
                <li>Best practices and tips</li>
                <li>Live Q&A session</li>
                <li>Exclusive resources</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #ea580c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Register Now</a>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">Limited seats available!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">See you there!<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "webinar_title", "date", "link", "company_name"],
      },
      {
        id: "company_update",
        name: "Company Updates",
        category: "informational",
        subject: "🚀 Exciting News from {{company_name}}!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb; margin-bottom: 20px;">🚀 Exciting Updates!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">We have some exciting news to share with you about {{company_name}}!</p>
              <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">✨ What's New:</h3>
                <ul style="color: #1e40af; line-height: 1.8;">
                  <li>New feature launches</li>
                  <li>Product improvements</li>
                  <li>Team updates</li>
                  <li>Future roadmap</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Learn More</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Thank you for being part of our journey!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "valentines_day",
        name: "Valentine's Day Campaign",
        category: "seasonal",
        subject: "💝 Spread the Love - Valentine's Day Special!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #ec4899; text-align: center; margin-bottom: 20px;">💝 Valentine's Day Special</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Spread the love this Valentine's Day with our special offer!</p>
              <div style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 32px;">💝 Love is in the Air</h2>
                <p style="margin: 15px 0 0 0; font-size: 18px;">Special Valentine's Offer Inside!</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #ec4899; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Claim Your Offer</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">With love,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "mothers_day",
        name: "Mother's Day Campaign",
        category: "seasonal",
        subject: "💐 Celebrate Mom - Mother's Day Special",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #f59e0b; text-align: center; margin-bottom: 20px;">💐 Happy Mother's Day!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Celebrate the special moms in your life with our Mother's Day offer!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Shop Now</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "fathers_day",
        name: "Father's Day Campaign",
        category: "seasonal",
        subject: "👔 Honor Dad - Father's Day Special",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb; text-align: center; margin-bottom: 20px;">👔 Happy Father's Day!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Show Dad how much he means to you with our Father's Day special!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Shop Now</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "fourth_july",
        name: "Fourth of July Campaign",
        category: "seasonal",
        subject: "🇺🇸 Independence Day Sale - Celebrate Freedom!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #dbeafe 0%, #fee2e2 100%);">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626; text-align: center; margin-bottom: 20px;">🇺🇸 Independence Day Sale!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Celebrate Independence Day with our special patriotic offer!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Claim Offer</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Happy 4th of July!<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "thanksgiving",
        name: "Thanksgiving Campaign",
        category: "seasonal",
        subject: "🦃 Grateful for You - Thanksgiving Special",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #ea580c; text-align: center; margin-bottom: 20px;">🦃 Happy Thanksgiving!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">This Thanksgiving, we're grateful for amazing customers like you!</p>
              <div style="background-color: #fed7aa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="color: #9a3412; margin-top: 0;">🙏 Thank You for Being Part of Our Community</h3>
                <p style="color: #9a3412;">As a token of our appreciation, enjoy this special offer!</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #ea580c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Claim Your Gift</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">With gratitude,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "christmas",
        name: "Christmas Campaign",
        category: "seasonal",
        subject: "🎄 Merry Christmas - Holiday Special Inside!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #dcfce7 0%, #fecaca 100%);">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626; text-align: center; margin-bottom: 20px;">🎄 Merry Christmas!</h1>
              <div style="background: linear-gradient(135deg, #dc2626 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 32px;">🎁 Holiday Special</h2>
                <p style="margin: 15px 0 0 0; font-size: 18px;">Our Gift to You This Season!</p>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Wishing you a magical Christmas filled with joy and happiness!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">As our way of saying thank you, we're offering you a special holiday gift!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Unwrap Your Gift</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Merry Christmas!<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "link", "company_name"],
      },
      {
        id: "re_engagement",
        name: "Re-engagement Campaign",
        category: "retention",
        subject: "👋 We Miss You, {{username}}!",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #7c3aed; margin-bottom: 20px;">👋 We Miss You!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">It's been a while since we last saw you at {{company_name}}. We've missed having you around!</p>
              <div style="background-color: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #5b21b6; margin-top: 0;">✨ Here's What You've Missed:</h3>
                <ul style="color: #5b21b6; line-height: 1.8;">
                  <li>New features and improvements</li>
                  <li>Enhanced user experience</li>
                  <li>Exclusive content and resources</li>
                  <li>Special offers just for you</li>
                </ul>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">We'd love to have you back! As a welcome back gift, we're offering you <strong>{{credits}} bonus credits</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{link}}" style="background-color: #7c3aed; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Come Back & Claim Credits</a>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Hope to see you soon!<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        variables: ["username", "credits", "link", "company_name"],
      },
    ];
  },
});
