# N8N Booking System - Admin Guide

**Last Updated:** Jan 26, 2026  
**Audience:** System Administrators  
**Status:** Complete

---

## 📋 Overview

Complete administrator guide for configuring and managing the N8N booking system. This guide covers all settings, best practices, and maintenance procedures.

---

## 🚀 Quick Start

### Initial Setup (5 minutes)

1. **Access Booking Management**
   - Navigate to: Booking Management (sidebar)
   - Click: Availability tab

2. **Configure Global Settings**
   - Set week view time range (e.g., 09:00 - 17:00)
   - Set global timezone (e.g., Asia/Kuala_Lumpur)
   - Set minimum notice hours (default: 24)
   - Set maximum booking window (default: 60 days)

3. **Enable Days**
   - Toggle ON for available days (Monday-Friday)
   - Set hours for each day
   - Save settings

4. **Test**
   - Create test appointment
   - Verify in calendar
   - Delete test appointment

---

## ⚙️ Configuration Settings

### Global Time Range

**Location:** Availability → Booking Settings → Week View Time Range

**Purpose:** Defines the overall time window for all bookings

**Settings:**
- **Start Time** - Earliest booking time (e.g., 06:00)
- **End Time** - Latest booking time (e.g., 21:00)

**Best Practices:**
- Set wider than actual business hours for flexibility
- Consider time zones if serving global clients
- Leave buffer for early/late appointments

**Example Configurations:**

```
Standard Business:
  Start: 09:00
  End: 17:00

Extended Hours:
  Start: 06:00
  End: 21:00

24/7 Service:
  Start: 00:00
  End: 23:59
```

---

### Global Timezone

**Location:** Availability → Booking Settings → Global Timezone

**Purpose:** All bookings are processed in this timezone

**Options:**
- UTC (default)
- America/New_York (Eastern)
- America/Los_Angeles (Pacific)
- Europe/London (GMT/BST)
- Asia/Singapore (SGT)
- Asia/Kuala_Lumpur (MYT)
- And more...

**Important:**
- Choose timezone matching your business location
- All times displayed to users will be in this timezone
- Changing timezone affects existing appointments

**Recommendation:** Use your primary business location's timezone

---

### Booking Window

**Location:** Availability → Booking Settings → Scheduling Window

**Settings:**

1. **Minimum Notice Time**
   - Hours required before appointment
   - Default: 24 hours
   - Range: 0-168 hours (1 week)
   
   **Use Cases:**
   - Same-day bookings: 2-4 hours
   - Standard: 24 hours
   - Planning required: 48-72 hours

2. **Maximum Booking Window**
   - Days ahead clients can book
   - Default: 60 days
   - Range: 1-365 days
   
   **Use Cases:**
   - Short-term: 30 days
   - Standard: 60-90 days
   - Long-term planning: 180-365 days

---

### Day-Specific Availability

**Location:** Availability → Day Availability Cards

**For Each Day:**
- **Toggle** - Enable/disable the day
- **Start Time** - Day-specific start time
- **End Time** - Day-specific end time

**Example Configuration:**

```
Monday-Friday:
  Enabled: Yes
  Hours: 09:00 - 17:00

Saturday:
  Enabled: Yes
  Hours: 10:00 - 14:00

Sunday:
  Enabled: No
```

**Important:**
- Day hours must be within global time range
- Disabled days cannot be booked
- Changes apply immediately

---

## 📊 Monitoring & Maintenance

### Daily Checks

**Morning Routine:**
1. Check today's appointments
2. Verify no conflicts
3. Review pending bookings
4. Check for cancellations

**Tools:**
- Calendar view (Day/Week)
- Appointment list
- Status filters

### Weekly Reviews

**Every Monday:**
1. Review upcoming week
2. Check availability settings
3. Verify no gaps in coverage
4. Update blocked dates if needed

**Metrics to Track:**
- Total bookings
- Cancellation rate
- No-show rate
- Popular time slots

### Monthly Maintenance

**First of Month:**
1. Review previous month's data
2. Adjust settings based on demand
3. Update availability for holidays
4. Archive old appointments

**Reports to Generate:**
- Booking trends
- Peak times
- Client statistics
- Revenue (if applicable)

---

## 🔒 Security & Access

### User Roles

**Admin Access:**
- Full configuration access
- Can modify all settings
- Can delete appointments
- Can view all data

**Staff Access:**
- View appointments
- Create/edit appointments
- Cannot modify settings
- Limited deletion rights

**Client Access:**
- Book appointments (via N8N)
- View own appointments
- Cancel own appointments
- No admin access

### Best Practices

1. **Limit Admin Access**
   - Only trusted staff
   - Use strong passwords
   - Enable 2FA if available

2. **Regular Audits**
   - Review access logs
   - Check for unauthorized changes
   - Monitor unusual activity

3. **Data Protection**
   - Regular backups
   - Secure client information
   - Comply with privacy laws

---

## 🛠️ Common Admin Tasks

### Task 1: Block a Date

**Use Case:** Holiday, vacation, special event

**Steps:**
1. Go to Calendar view
2. Click on the date
3. Select "Block Date"
4. Add reason (optional)
5. Save

**Alternative:** Disable day in Availability settings

### Task 2: Change Business Hours

**Use Case:** Seasonal hours, new schedule

**Steps:**
1. Go to Availability → Booking Settings
2. Update Week View Time Range
3. Update individual day hours if needed
4. Click "Save All Settings"
5. Test with sample booking

**Impact:** Immediate - affects all future bookings

### Task 3: Handle Conflicts

**If Two Appointments Overlap:**

1. **Identify Conflict**
   - Check calendar for overlaps
   - Review appointment times

2. **Resolve**
   - Contact clients
   - Reschedule one appointment
   - Update calendar

3. **Prevent Future**
   - Check conflict detection is working
   - Review Convex logs
   - Report bug if system issue

### Task 4: Bulk Reschedule

**Use Case:** Staff unavailable, emergency closure

**Steps:**
1. Export affected appointments
2. Contact all clients
3. Offer alternative times
4. Update appointments individually
5. Send confirmations

**Tools:**
- Appointment list with filters
- Date range selection
- Export to CSV (if available)

### Task 5: Update Timezone

**Use Case:** Business relocation, DST changes

**Steps:**
1. **Before Change:**
   - Notify all clients
   - Export appointment list
   - Note current timezone

2. **Make Change:**
   - Go to Availability → Booking Settings
   - Select new timezone
   - Save settings

3. **After Change:**
   - Verify existing appointments
   - Test new bookings
   - Monitor for issues

**Warning:** This affects ALL appointments!

---

## 📈 Optimization Tips

### Maximize Bookings

1. **Flexible Hours**
   - Offer early/late slots
   - Weekend availability
   - Lunch hour options

2. **Reduce Friction**
   - Lower minimum notice (if possible)
   - Extend booking window
   - Simplify booking process

3. **Popular Times**
   - Identify peak demand
   - Add more slots during peak
   - Adjust pricing (if applicable)

### Reduce No-Shows

1. **Reminders**
   - Send 24-hour reminder
   - Send day-of reminder
   - Include cancellation link

2. **Policies**
   - Clear cancellation policy
   - Minimum notice requirement
   - Deposit or prepayment

3. **Follow-Up**
   - Contact no-shows
   - Understand reasons
   - Adjust policies if needed

### Improve Efficiency

1. **Buffer Times**
   - Add buffer between appointments
   - Account for prep/cleanup
   - Prevent running late

2. **Batch Similar Appointments**
   - Group by type
   - Reduce context switching
   - Improve workflow

3. **Automate**
   - Use N8N for confirmations
   - Auto-send reminders
   - Sync with calendar

---

## 🎯 Best Practices

### Configuration

✅ **Do:**
- Test changes before going live
- Document your settings
- Keep settings simple
- Review regularly

❌ **Don't:**
- Make frequent changes
- Set unrealistic hours
- Ignore client feedback
- Forget to save settings

### Data Management

✅ **Do:**
- Regular backups
- Archive old data
- Monitor database size
- Clean test data

❌ **Don't:**
- Delete without backup
- Keep unnecessary data
- Ignore performance issues
- Mix test and production

### Communication

✅ **Do:**
- Notify clients of changes
- Provide clear instructions
- Respond to inquiries promptly
- Set expectations

❌ **Don't:**
- Make surprise changes
- Use technical jargon
- Ignore complaints
- Over-promise

---

## 🚨 Emergency Procedures

### System Down

**If booking system is unavailable:**

1. **Immediate:**
   - Post notice on website
   - Use backup booking method (phone/email)
   - Log all manual bookings

2. **Investigation:**
   - Check Convex status
   - Check N8N status
   - Review error logs

3. **Recovery:**
   - Fix underlying issue
   - Import manual bookings
   - Verify system working
   - Resume normal operations

### Data Loss

**If appointments are lost:**

1. **Stop:**
   - Don't make changes
   - Don't delete anything
   - Contact support immediately

2. **Recover:**
   - Restore from backup
   - Check Convex history
   - Reconstruct from emails/confirmations

3. **Prevent:**
   - Implement regular backups
   - Test restore procedures
   - Document recovery process

### Double Bookings

**If conflict detection fails:**

1. **Immediate:**
   - Identify all conflicts
   - Contact affected clients
   - Offer alternatives

2. **Resolution:**
   - Reschedule appointments
   - Apologize for inconvenience
   - Offer compensation if appropriate

3. **Prevention:**
   - Report bug
   - Review conflict detection code
   - Add additional validation

---

## 📞 Support & Resources

### Documentation

- **Main Guide:** N8N_BOOKING_INTEGRATION_COMPLETE.md
- **Testing:** TESTING_GUIDE.md
- **Troubleshooting:** TROUBLESHOOTING.md
- **This Guide:** ADMIN_GUIDE.md

### Getting Help

1. **Check Documentation** - Most questions answered here
2. **Review Logs** - Convex dashboard for errors
3. **Test Endpoints** - Verify API functionality
4. **Contact Support** - If issue persists

### Useful Links

- Convex Dashboard: https://dashboard.convex.dev
- N8N Documentation: https://docs.n8n.io
- Support Email: [Your support email]

---

## ✅ Admin Checklist

### Daily
- [ ] Review today's appointments
- [ ] Check for conflicts
- [ ] Monitor system status

### Weekly
- [ ] Review upcoming week
- [ ] Update blocked dates
- [ ] Check availability settings
- [ ] Review metrics

### Monthly
- [ ] Generate reports
- [ ] Archive old data
- [ ] Review and adjust settings
- [ ] Plan for holidays/events

### Quarterly
- [ ] Full system audit
- [ ] Review security
- [ ] Update documentation
- [ ] Train staff on changes

---

## 🎓 Training Resources

### For New Admins

**Week 1: Basics**
- System overview
- Navigation
- Basic configuration
- Creating appointments

**Week 2: Advanced**
- Availability settings
- Conflict resolution
- Reporting
- Troubleshooting

**Week 3: Mastery**
- Optimization
- N8N integration
- Emergency procedures
- Best practices

### Training Checklist

- [ ] Complete system tour
- [ ] Configure test environment
- [ ] Create/edit/delete appointments
- [ ] Modify availability settings
- [ ] Handle conflicts
- [ ] Generate reports
- [ ] Perform backup/restore
- [ ] Troubleshoot common issues

---

**Admin guide complete!** Use this as your primary reference for system management. ✅
