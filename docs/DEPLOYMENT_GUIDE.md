# 🚀 Chatbot System Deployment Guide

**Complete deployment guide for the AI chatbot system**

---

## 📋 Pre-Deployment Checklist

### ✅ Required Components Installed
- [x] All UI components (ScrollArea, Calendar, Textarea, etc.)
- [x] Database schema deployed to Convex
- [x] All Convex functions uploaded
- [x] Navigation links added to admin sidebar
- [x] All React components created

### ✅ Environment Setup
- [ ] Convex project configured
- [ ] n8n instance running
- [ ] OpenAI API key obtained
- [ ] Clerk authentication configured
- [ ] Domain/hosting configured

---

## 🔧 Step 1: Convex Database Setup

### Deploy Schema
```bash
cd d:\gemini\startupkit
npx convex dev
```

**Verify Tables Created**:
1. Open Convex Dashboard: https://dashboard.convex.dev
2. Navigate to your project
3. Check "Data" tab for these 8 tables:
   - ✅ `knowledge_base`
   - ✅ `chatbot_config`
   - ✅ `chatbot_conversations`
   - ✅ `lead_capture_config`
   - ✅ `chat_appointments`
   - ✅ `user_attributes`
   - ✅ `chatbot_analytics`
   - ✅ `admin_chat_queue`

### Verify Functions Deployed
Check "Functions" tab for:
- ✅ `chatbot.ts` (7 functions)
- ✅ `knowledgeBase.ts` (7 functions)
- ✅ `analytics.ts` (2 functions)

---

## 🤖 Step 2: n8n Workflow Setup

### Install n8n (if not already installed)

**Option 1: Docker**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option 2: npm**
```bash
npm install n8n -g
n8n start
```

**Option 3: Cloud**
- Sign up at https://n8n.io/cloud
- No installation needed

### Create Basic Chatbot Workflow

1. **Access n8n**: Open http://localhost:5678 (or your n8n cloud URL)

2. **Create New Workflow**: Click "New Workflow"

3. **Import Workflow**: 
   - Click "..." menu → "Import from File"
   - Use JSON from `docs/N8N_WORKFLOW_GUIDE.md`
   - Or build manually following the guide

4. **Configure Webhook Node**:
   - Click Webhook node
   - Set path: `chatbot-frontend`
   - Set method: POST
   - Click "Execute Node" to get URL
   - Copy the Production URL

5. **Configure OpenAI Node**:
   - Click OpenAI node
   - Add credentials:
     - Name: "OpenAI Account"
     - API Key: Your OpenAI API key
   - Select model: `gpt-4` or `gpt-3.5-turbo`
   - Configure system prompt

6. **Activate Workflow**: Toggle "Active" switch

7. **Test Webhook**:
   ```bash
   curl -X POST https://your-n8n.com/webhook/chatbot-frontend \
     -H "Content-Type: application/json" \
     -d '{
       "chatId": "test_123",
       "message": "Hello, how can you help me?",
       "route": "frontend"
     }'
   ```

### Create User Panel Workflow

Repeat above steps with:
- Webhook path: `chatbot-user-panel`
- Different system prompt for authenticated users
- Access to user context

---

## ⚙️ Step 3: Configure Admin Panel

### Access Chatbot Settings

1. **Navigate**: Go to `/admin/chatbot-settings`

2. **Configure Frontend Chatbot**:
   - Toggle "Enable Frontend Chatbot" → ON
   - Paste n8n webhook URL: `https://your-n8n.com/webhook/chatbot-frontend`
   - Set primary color: `#854fff` (or your brand color)
   - Click "Test Connection"
   - Verify success message
   - Click "Save Configuration"

3. **Configure User Panel Chatbot**:
   - Switch to "User Panel Chatbot" tab
   - Toggle "Enable User Panel Chatbot" → ON
   - Paste webhook URL: `https://your-n8n.com/webhook/chatbot-user-panel`
   - Set primary color
   - Test and save

---

## 📚 Step 4: Populate Knowledge Base

### Create Initial Articles

1. **Navigate**: Go to `/admin/knowledge-base`

2. **Create Articles**:
   - Click "New Article"
   - Fill in:
     - Title: "How to reset your password"
     - Category: "Account Management"
     - Content: Detailed instructions
     - Tags: password, reset, account
     - Keywords: forgot password, can't login, reset password
     - Status: Published
   - Click "Create Article"

3. **Recommended Articles**:
   - Account management (login, password, profile)
   - Billing & payments (subscriptions, invoices, refunds)
   - Product features (how-tos, tutorials)
   - Troubleshooting (common issues, errors)
   - Contact information (support hours, escalation)

4. **Best Practices**:
   - Write clear, concise content
   - Use natural language
   - Include common variations in keywords
   - Keep articles focused on one topic
   - Update regularly based on user questions

---

## 🎨 Step 5: Add Chat Widget to Pages

### Frontend Widget (Landing Page)

**File**: `app/page.tsx`

```tsx
import { ChatWidget } from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <div>
      {/* Your page content */}
      <h1>Welcome to StartupKit</h1>
      
      {/* Add chat widget at the end */}
      <ChatWidget type="frontend" />
    </div>
  );
}
```

### User Panel Widget (Dashboard)

**File**: `app/dashboard/layout.tsx`

```tsx
import { ChatWidget } from "@/components/ChatWidget";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  
  return (
    <div>
      {children}
      
      {/* Add authenticated chat widget */}
      <ChatWidget type="user_panel" userId={user?.id} />
    </div>
  );
}
```

---

## 🧪 Step 6: Test End-to-End

### Frontend Chatbot Test

1. **Open Landing Page**: Navigate to `/`
2. **Verify Widget**: Chat button appears in bottom-right
3. **Open Chat**: Click the button
4. **Send Message**: Type "Hello" and press Enter
5. **Verify Response**: Bot responds within 2-3 seconds
6. **Test Features**:
   - Multiple messages
   - Session persistence (refresh page)
   - Lead capture (after 3+ messages)
   - Agent intervention button
   - Image upload

### User Panel Chatbot Test

1. **Login**: Sign in to dashboard
2. **Open Chat**: Widget should appear
3. **Send Message**: Test with user context
4. **Verify**: Bot has access to user info

### Admin Dashboard Test

1. **Navigate**: Go to `/admin/live-chat`
2. **Verify**: Conversations appear in list
3. **Select Conversation**: Click on a conversation
4. **Take Over**: Click "Take Over" button
5. **Send Message**: Type and send admin message
6. **Verify**: User receives admin message
7. **Resolve**: Click "Resolve" button

### Knowledge Base Test

1. **Create Article**: Add test article
2. **Ask Question**: In chat widget, ask related question
3. **Verify**: Bot uses KB content in response

### Analytics Test

1. **Navigate**: Go to `/admin/chatbot-analytics`
2. **Verify**: Stats display correctly
3. **Check Charts**: All charts render
4. **Test Filters**: Switch time ranges and chatbot types

---

## 🔐 Step 7: Security Configuration

### Webhook Security

**Add Authentication to n8n Webhooks**:

1. In n8n workflow, add "Code" node before webhook response
2. Add validation:
   ```javascript
   const authHeader = $input.item.headers.authorization;
   const expectedToken = 'your-secret-token-here';
   
   if (authHeader !== `Bearer ${expectedToken}`) {
     throw new Error('Unauthorized');
   }
   
   return $input.item.json;
   ```

3. Update ChatWidget to send auth header:
   ```typescript
   headers: {
     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_N8N_AUTH_TOKEN}`
   }
   ```

### Environment Variables

**Create `.env.local`**:
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# n8n Webhooks
NEXT_PUBLIC_N8N_FRONTEND_WEBHOOK=https://your-n8n.com/webhook/chatbot-frontend
NEXT_PUBLIC_N8N_USER_PANEL_WEBHOOK=https://your-n8n.com/webhook/chatbot-user-panel
NEXT_PUBLIC_N8N_AUTH_TOKEN=your-secret-token

# OpenAI (for n8n)
OPENAI_API_KEY=sk-...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Rate Limiting

**Add to n8n workflow**:
```javascript
// Track requests per session
const sessionId = $json.chatId;
const requestCount = $json.requestCount || 0;

if (requestCount > 20) {
  return {
    output: "You've reached the message limit. Please try again in 5 minutes.",
    rateLimited: true
  };
}
```

---

## 📊 Step 8: Monitoring Setup

### Convex Logs

1. Open Convex Dashboard
2. Go to "Logs" tab
3. Monitor function calls
4. Set up alerts for errors

### n8n Monitoring

1. In n8n, go to "Executions"
2. Monitor workflow runs
3. Check for failed executions
4. Set up error notifications

### Analytics Tracking

1. Check `/admin/chatbot-analytics` daily
2. Monitor key metrics:
   - Total conversations
   - Resolution rate
   - Escalation rate
   - Response times
3. Review top questions weekly
4. Update KB based on patterns

---

## 🎓 Step 9: Train Admin Team

### Admin Training Checklist

**Live Chat Dashboard**:
- [ ] How to access dashboard
- [ ] Understanding conversation statuses
- [ ] Taking over conversations
- [ ] Sending messages
- [ ] Resolving conversations
- [ ] Editing user attributes

**Knowledge Base**:
- [ ] Creating articles
- [ ] Organizing by category
- [ ] Using tags and keywords
- [ ] Publishing vs drafts
- [ ] Updating existing articles

**Analytics**:
- [ ] Reading metrics
- [ ] Understanding trends
- [ ] Identifying issues
- [ ] Using data for improvements

**Best Practices**:
- [ ] Response time expectations
- [ ] Tone and language guidelines
- [ ] Escalation procedures
- [ ] Privacy and security

### Create Admin Documentation

**File**: `docs/ADMIN_GUIDE.md`
- Dashboard overview
- Common tasks
- Troubleshooting
- FAQ

---

## 🚀 Step 10: Go Live

### Pre-Launch Checklist

- [ ] All tests passed
- [ ] Knowledge base populated (minimum 10 articles)
- [ ] Admin team trained
- [ ] Monitoring configured
- [ ] Backup plan ready
- [ ] Support escalation process defined

### Launch Steps

1. **Enable Chatbots**:
   - Frontend chatbot: ON
   - User panel chatbot: ON

2. **Monitor First Hour**:
   - Watch live chat dashboard
   - Check for errors in logs
   - Verify response times
   - Test admin takeover

3. **Gradual Rollout** (Optional):
   - Start with 10% of users
   - Monitor for issues
   - Increase to 50%
   - Full rollout after 24 hours

### Post-Launch

**First 24 Hours**:
- Monitor continuously
- Respond to all escalations quickly
- Log any issues
- Gather user feedback

**First Week**:
- Review analytics daily
- Update KB based on questions
- Optimize n8n workflows
- Adjust response templates

**First Month**:
- Analyze trends
- Identify improvement areas
- Train AI on common patterns
- Expand KB coverage

---

## 🔧 Troubleshooting

### Widget Not Appearing

**Check**:
1. Chatbot enabled in settings?
2. Widget component imported?
3. Console errors?
4. Convex connection working?

**Fix**:
```tsx
// Verify import
import { ChatWidget } from "@/components/ChatWidget";

// Verify usage
<ChatWidget type="frontend" />
```

### Bot Not Responding

**Check**:
1. n8n workflow active?
2. Webhook URL correct?
3. OpenAI API key valid?
4. Network connectivity?

**Test**:
```bash
# Test webhook directly
curl -X POST https://your-n8n.com/webhook/chatbot-frontend \
  -H "Content-Type: application/json" \
  -d '{"chatId":"test","message":"hello","route":"frontend"}'
```

### Slow Response Times

**Optimize**:
1. Use GPT-3.5-turbo instead of GPT-4
2. Reduce system prompt length
3. Implement caching for common questions
4. Use streaming responses

### Admin Takeover Not Working

**Check**:
1. Admin authenticated?
2. Conversation status correct?
3. Convex function permissions?
4. Real-time updates enabled?

---

## 📈 Optimization Tips

### Performance

1. **Cache Common Responses**:
   - Store frequent Q&A pairs
   - Return cached response instantly
   - Update cache weekly

2. **Optimize KB Search**:
   - Index keywords properly
   - Use vector search (future)
   - Limit search results

3. **Reduce API Calls**:
   - Batch analytics queries
   - Use Convex subscriptions
   - Implement debouncing

### User Experience

1. **Improve Response Quality**:
   - Refine system prompts
   - Add more KB articles
   - Train on actual conversations

2. **Reduce Escalations**:
   - Better keyword detection
   - Proactive suggestions
   - Clear escalation path

3. **Mobile Optimization**:
   - Test on various devices
   - Optimize touch targets
   - Reduce animation overhead

---

## 🎯 Success Metrics

### Track These KPIs

**User Satisfaction**:
- Average rating: Target 4.0+/5.0
- Response time: Target < 3 seconds
- Resolution rate: Target 70%+

**Efficiency**:
- Escalation rate: Target < 20%
- Admin response time: Target < 2 minutes
- Conversations per admin: Track trend

**Growth**:
- Total conversations: Monitor growth
- Repeat users: Track engagement
- KB coverage: Expand monthly

---

## 📞 Support & Resources

### Documentation
- `docs/CHATBOT.md` - Full feature documentation
- `docs/N8N_WORKFLOW_GUIDE.md` - Workflow examples
- `docs/TESTING_CHECKLIST.md` - Testing guide
- `docs/ADMIN_GUIDE.md` - Admin manual

### External Resources
- n8n Documentation: https://docs.n8n.io
- Convex Documentation: https://docs.convex.dev
- OpenAI API: https://platform.openai.com/docs
- shadcn/ui: https://ui.shadcn.com

### Getting Help
- GitHub Issues: Report bugs
- Discord Community: Ask questions
- Email Support: support@startupkit.com

---

**Deployment Status**: ✅ Ready  
**Last Updated**: January 14, 2026  
**Version**: 1.0.0  
**Maintained by**: StartupKit Development Team

🎉 **Congratulations! Your AI chatbot system is now live!** 🎉
