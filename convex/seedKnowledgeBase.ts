import { mutation } from "./_generated/server";

// Seed sample knowledge base articles
export const seedKnowledgeBase = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const createdBy = identity.subject;

    // Frontend Knowledge Base (Public)
    const frontendArticles = [
      {
        type: "frontend" as const,
        title: "Business Hours",
        content: `# Business Hours

We are open to serve you during the following hours:

**Monday - Friday**
- 9:00 AM - 5:00 PM

**Saturday**
- 10:00 AM - 2:00 PM

**Sunday**
- Closed

**Holidays**
We are closed on major public holidays. Please check our website for specific holiday schedules.

**Emergency Contact**
For urgent matters outside business hours, please email support@example.com and we'll respond as soon as possible.`,
        category: "general",
        tags: ["hours", "schedule", "availability", "open", "closed"],
        keywords: ["hours", "open", "closed", "schedule", "time", "when", "available"],
        status: "published" as const,
      },
      {
        type: "frontend" as const,
        title: "Cancellation Policy",
        content: `# Cancellation Policy

We understand that plans change. Here's our cancellation policy:

**Free Cancellation**
- Appointments can be cancelled or rescheduled up to 24 hours in advance without any penalty.

**Late Cancellation**
- Cancellations within 24 hours of the appointment may incur a cancellation fee.
- The fee is 50% of the appointment cost.

**No-Show Policy**
- If you miss your appointment without notice, you will be charged the full appointment fee.
- After 2 no-shows, we may require prepayment for future appointments.

**How to Cancel**
1. Use our online booking system
2. Call us during business hours
3. Email us at bookings@example.com

**Rescheduling**
You can reschedule your appointment at any time, subject to availability. No fees apply for rescheduling.`,
        category: "policies",
        tags: ["cancellation", "policy", "reschedule", "no-show"],
        keywords: ["cancel", "reschedule", "change", "policy", "fee", "no-show"],
        status: "published" as const,
      },
      {
        type: "frontend" as const,
        title: "Services Offered",
        content: `# Our Services

We offer a variety of professional services to meet your needs:

## Consultation Services

**Initial Consultation** (60 minutes)
- Comprehensive assessment
- Personalized recommendations
- Action plan development
- Price: $150

**Follow-up Session** (30 minutes)
- Progress review
- Adjustments to plan
- Q&A session
- Price: $75

## Group Services

**Group Workshop** (90 minutes)
- Interactive learning
- Up to 10 participants
- Hands-on activities
- Price: $50 per person

## Virtual Services

**Virtual Appointment** (30-60 minutes)
- Video consultation via Zoom or Google Meet
- Same quality as in-person
- Flexible scheduling
- Same pricing as in-person

## Packages

**Starter Package**
- 3 follow-up sessions
- Email support
- Price: $200 (save $25)

**Premium Package**
- Initial consultation + 5 follow-up sessions
- Priority scheduling
- Email and phone support
- Price: $500 (save $75)

All services include a satisfaction guarantee. If you're not satisfied, we'll work with you to make it right.`,
        category: "services",
        tags: ["services", "appointments", "types", "pricing", "consultation"],
        keywords: ["services", "consultation", "session", "appointment", "types", "price", "cost", "package"],
        status: "published" as const,
      },
      {
        type: "frontend" as const,
        title: "How to Book an Appointment",
        content: `# How to Book an Appointment

Booking with us is easy! Here are your options:

## Online Booking (Recommended)

1. **Visit our booking page** or use this chatbot
2. **Select your service** - Choose from our available services
3. **Pick a date and time** - See real-time availability
4. **Enter your details** - Name, email, phone number
5. **Confirm** - You'll receive an instant confirmation email

## Phone Booking

Call us during business hours:
- Phone: (555) 123-4567
- Monday-Friday: 9:00 AM - 5:00 PM
- Saturday: 10:00 AM - 2:00 PM

## Email Booking

Send us an email with:
- Your preferred service
- 2-3 date/time options
- Your contact information

Email: bookings@example.com

We'll respond within 24 hours.

## Walk-in

We accept walk-ins based on availability, but we recommend booking in advance to guarantee your preferred time slot.

## What You'll Need

- Valid email address (for confirmation)
- Phone number (for reminders)
- Payment method (for packages or deposits)

## Confirmation

You'll receive:
- Immediate email confirmation
- SMS reminder 24 hours before
- Calendar invite (if requested)`,
        category: "booking",
        tags: ["booking", "how-to", "appointment", "schedule"],
        keywords: ["book", "schedule", "appointment", "how", "reserve", "make"],
        status: "published" as const,
      },
      {
        type: "frontend" as const,
        title: "Frequently Asked Questions",
        content: `# Frequently Asked Questions

## General Questions

**Q: Do I need to create an account?**
A: No, you can book as a guest. However, creating an account allows you to manage your appointments more easily.

**Q: How far in advance can I book?**
A: You can book up to 60 days in advance.

**Q: What's the minimum notice for booking?**
A: We require at least 24 hours notice for all appointments.

**Q: Do you offer same-day appointments?**
A: Subject to availability, yes. Please call us to check.

## Payment Questions

**Q: When do I pay?**
A: Payment is due at the time of service, unless you've purchased a package in advance.

**Q: What payment methods do you accept?**
A: We accept credit cards, debit cards, and online payment methods.

**Q: Do you offer refunds?**
A: Yes, for cancellations made more than 24 hours in advance.

## Service Questions

**Q: What should I bring to my appointment?**
A: Just yourself! We provide everything you need.

**Q: Can I bring someone with me?**
A: Yes, you're welcome to bring a companion.

**Q: Are virtual appointments as effective as in-person?**
A: Yes, our virtual appointments offer the same quality of service.

## Technical Questions

**Q: I didn't receive a confirmation email. What should I do?**
A: Check your spam folder. If it's not there, contact us and we'll resend it.

**Q: How do I reschedule my appointment?**
A: Use the link in your confirmation email, or contact us directly.

**Q: Can I cancel through this chatbot?**
A: Yes! Just let me know your email address and I can help you cancel or reschedule.`,
        category: "faq",
        tags: ["faq", "questions", "help", "support"],
        keywords: ["faq", "question", "help", "how", "what", "when", "where", "why"],
        status: "published" as const,
      },
    ];

    // Backend Knowledge Base (Authenticated Users)
    const backendArticles = [
      {
        type: "backend" as const,
        title: "Admin Dashboard Guide",
        content: `# Admin Dashboard Guide

Welcome to the admin dashboard! Here's how to use the system effectively.

## Dashboard Overview

The main dashboard shows:
- Today's appointments
- Upcoming appointments
- Recent activity
- Key metrics

## Managing Appointments

**View Appointments**
- Calendar view: See all appointments visually
- List view: Detailed appointment information
- Filter by status, date, or client

**Create Appointment**
1. Click "New Appointment"
2. Select client (or create new)
3. Choose date and time
4. Set duration and type
5. Add notes if needed
6. Save

**Edit Appointment**
- Click on any appointment
- Modify details
- System checks for conflicts automatically
- Save changes

**Cancel Appointment**
- Open appointment details
- Click "Cancel"
- Optionally add cancellation reason
- Client receives notification

## Managing Clients

**View Clients**
- See all clients in the Clients section
- Search by name, email, or phone
- View appointment history

**Client Details**
- Contact information
- Appointment statistics
- Notes and tags
- Communication history

## Settings

**Availability Settings**
- Set your working hours for each day
- Add breaks
- Set buffer times
- Configure maximum appointments per day

**Booking Settings**
- Minimum notice time
- Maximum booking window
- Default appointment duration
- Timezone settings

## Reports

Access reports for:
- Appointment statistics
- Revenue tracking
- Client analytics
- No-show rates`,
        category: "admin",
        tags: ["admin", "dashboard", "guide", "help"],
        keywords: ["admin", "dashboard", "manage", "settings", "configure"],
        status: "published" as const,
      },
      {
        type: "backend" as const,
        title: "Troubleshooting Common Issues",
        content: `# Troubleshooting Common Issues

## Appointment Issues

**Problem: Appointments not showing in calendar**
- Check date range filter
- Verify appointment status (might be cancelled)
- Refresh the page
- Check if correct calendar view is selected

**Problem: Cannot create appointment**
- Verify time slot is available
- Check if within business hours
- Ensure no conflicts exist
- Verify client information is complete

**Problem: Double bookings**
- This shouldn't happen due to conflict detection
- If it does, report immediately
- Cancel one appointment
- Contact affected client

## Client Issues

**Problem: Cannot find client**
- Check spelling of name/email
- Use search function
- Client might be marked as inactive
- Try searching by phone number

**Problem: Duplicate clients**
- Use merge function in client settings
- Choose primary record
- All appointments will be consolidated

## System Issues

**Problem: Slow performance**
- Clear browser cache
- Check internet connection
- Try different browser
- Contact support if persists

**Problem: Changes not saving**
- Check internet connection
- Verify you have permission
- Try refreshing page
- Check for error messages

## Email Issues

**Problem: Confirmation emails not sending**
- Check email settings
- Verify email template is active
- Check spam folder
- Verify client email is correct

**Problem: Reminders not sending**
- Check reminder settings
- Verify timing configuration
- Check email logs
- Ensure reminders are enabled

## Getting Help

If you can't resolve an issue:
1. Check this knowledge base
2. Review system logs
3. Contact technical support
4. Provide error messages and screenshots`,
        category: "support",
        tags: ["troubleshooting", "issues", "problems", "help", "support"],
        keywords: ["problem", "issue", "error", "not working", "help", "fix", "troubleshoot"],
        status: "published" as const,
      },
    ];

    // Insert all articles
    const allArticles = [...frontendArticles, ...backendArticles];
    
    for (const article of allArticles) {
      await ctx.db.insert("knowledge_base", {
        ...article,
        version: 1,
        createdAt: now,
        updatedAt: now,
        createdBy,
      });
    }

    return {
      success: true,
      message: `Created ${frontendArticles.length} frontend and ${backendArticles.length} backend articles`,
      counts: {
        frontend: frontendArticles.length,
        backend: backendArticles.length,
        total: allArticles.length,
      },
    };
  },
});
