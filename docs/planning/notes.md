clerk metdata JWT Template
{
	"aud": "convex",
	"name": "{{user.first_name}} {{user.last_name}}",
	"email": "{{user.primary_email_address}}",
	"roles": "{{org.roles}}",
	"picture": "{{user.image_url}}",
	"nickname": "{{user.username}}",
	"update_at": "{{user.updated_at}}",
	"given_name": "{{user.first_name}}",
	"family_name": "{{user.last_name}}",
	"phone_number": "{{user.primary_phone_number}}",
	"email_verified": "{{user.email_verified}}",
	"phone_number_verified": "{{user.phone_number_verified}}"
}

to 


{
	"aud": "convex",
	"name": "{{user.first_name}} {{user.last_name}}",
	"email": "{{user.primary_email_address}}",
	"public_metadata": "{{user.public_metadata}}",
	"org_id": "{{org.id}}",
	"org_role": "{{org.role}}",
	"picture": "{{user.image_url}}",
	"nickname": "{{user.username}}",
	"update_at": "{{user.updated_at}}",
	"given_name": "{{user.first_name}}",
	"family_name": "{{user.last_name}}",
	"phone_number": "{{user.primary_phone_number}}",
	"email_verified": "{{user.email_verified}}",
	"phone_number_verified": "{{user.phone_number_verified}}"
}


cloudflared tunnel --url http://localhost:3000





peheji7215@mypethealh.com
peheji7215@mypethealh.com

peheji7215




this is my project, I would like to make a customer support chat bot using Anthropic api key Haiku, I want to supply initial customer support guideline prompt to huiku, then proceed to build a few backend api for Haiku to access internal data to answer customer request. tell me what I need to supply to you. first, setup the anthropic api access engine, next setup the api access for the haiku customer support agent. next , build a demo sample chat interface to test the chat bot. do the development planning, do miss anything else, please ask me in the next response. no coding yet, let discuss the overall strategy before doing any coding.


Honest answer: **no, I did not test those.** Let me be precise about what I actually verified vs. what I'm assuming from code/memory:

**✅ Actually tested this session:**
- Credit **purchase** (top-up) via Stripe → webhook → ledger
- Credit **refund** (full, top-up path) via `charge.refunded`
- **Cycling guard** (5 flips → blocked)
- **Account suspension** (middleware redirect)
- **Fraud-check** UI (verdict, abnormal areas, PDF, Suspend button)

**❌ NOT tested this session (you're right to call this out):**
- **Subscription cancellation** — no
- **Subscription upgrade** — no
- **Subscription downgrade** — no
- **Invite member** (org invites) — no
- **Create organization** flow — no
- **Cancel credit purchase** (refund path specifically from a purchase cancellation, separate from `charge.refunded`) — no
- **Partial refund** math — no

So "Stripe handling all done" — **no, I can't claim that.** I only exercised the top-up purchase + full refund paths. Subscription lifecycle (cancel/upgrade/downgrade), org flows (create/invite), and partial refunds are **unverified** in this session. Code may exist and may be correct, but I didn't prove it end-to-end.

Want me to work through them one by one next session? I'd suggest this order: subscription cancel → upgrade → downgrade → partial refund → org create → invite member. Each is a separate Stripe/Clerk path and deserves its own verification.




docs/planning/plan_support_chat_cache_marker.md.