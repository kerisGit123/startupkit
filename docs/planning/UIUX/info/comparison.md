The four competitors side by side
Krock.io	Boords	Storyboarder.ai	Higgsfield.ai
Free tier	✅ Unlimited reviewers, 2 projects, 50 AI tokens	30-day refund only	✅ Trial: 2 projects, 50 img gen	✅ 10 credits/day
Entry paid	~$14/mo	Standard (annual save 20%)	$26/mo (annual)	$9/mo (annual)
Mid	Pro (unlimited projects, 4K)	Workflow (unlimited AI)	Pro $67/mo (annual)	$17.40/mo
High	Studio $23.99/user/mo	—	Production $169/mo	$29.40/mo
Enterprise	Unlimited plan	—	Custom	$49/seat
Pricing unit	Per workspace (flat)	Per seat ($15 extras)	Per user	Per user + credits
Credit system	AI tokens (50 free)	AI image caps (1k/∞)	Unlimited images, limited videos	Credits expire 90d, no rollover
Free trial	7 days Pro/Unlimited	Sign-up	Trial plan	Daily free credits
Sources: Krock.io pricing, Krock G2 pricing, Boords pricing, Storyboarder.ai pricing, Higgsfield pricing, Higgsfield 2026 review.

Four very different pricing philosophies
1. Krock.io — "Flat workspace pricing, unlimited people"
Model: One flat price, unlimited reviewers/clients/freelancers. "Fixed pricing. No per-user fee." is their tagline. Pro = unlimited projects. Studio charges per-user only above a threshold.

Who it's for: Agencies who hate "$15 more per seat" surprises. They want to invite 30 freelance animators without rebudgeting.

Credits role: Small (50 AI tokens on Free). AI isn't their core — review/collaboration is.

2. Boords — "Per-seat, AI quota as differentiator"
Model: $15/extra seat flat. The upgrade lever is AI images (1,000/mo → unlimited). Everything else (exports, templates, storyboards) is already unlimited on Standard.

Who it's for: Pre-production teams where 1–3 people do the work. AI is a cost center they meter.

Credits role: Soft quotas per tier, not a purchase. You upgrade the plan to lift the cap, you don't buy credit packs.

3. Storyboarder.ai — "AI-first, tiered by project count + story length"
Model: Tiers gate how much creative work you can do — 5 projects → unlimited, 10 pages → 30 → unlimited. Video generations are a flat 10/plan across all tiers (the expensive thing is rationed hard). Images are unlimited because they're cheap.

Who it's for: Solo filmmakers and writers doing real production work. The 4-tier escalator ($26 → $67 → $169) is classic SaaS price anchoring.

Credits role: Hidden. Users see "5 projects" or "unlimited images" — the credit math happens behind the scenes.

4. Higgsfield.ai — "Pure credit-bucket model"
Model: Every tier = a credit bucket. $9 → 150, $29 → 600, $49 → 1,200, $249 → 6,000. Videos cost 15–70 credits each, images 0.25–5. Credits expire in 90 days. Monthly credits don't roll over.

Who it's for: Power users chasing the newest models (Sora, Veo, Kling). They don't care about "projects," they care about generations.

Credits role: The product is credits. Everything is priced in credits. Tier = credit volume + concurrency + model access.

The big pattern: they're all different because they optimize different things
Optimizer	Who uses it	Best for
Workspace flat fee (Krock)	Agencies with lots of reviewers	Collaboration-heavy tools
Per-seat + AI quota (Boords)	Small pre-prod teams	Workflow tools where AI is an add-on
Project/length tiers (Storyboarder)	Solo creators scaling up	Production-focused tools
Credit bucket (Higgsfield)	Power users chasing models	AI generation tools
Where your Storytica fits
Your product is closest to Storyboarder.ai + Higgsfield — you're AI-first (11+ models) like Higgsfield, but project-centric (storyboards, frames, scenes) like Storyboarder.ai. You're NOT Krock (not a review platform) and NOT Boords (not workflow-first).

That means: a hybrid tier + credit model is the right fit for you. Neither pure credits (feels like a gas station) nor pure project counts (doesn't reflect that a 4K Veo video costs 100× a 1K Nano Banana image).

Concrete recommendation for Storytica pricing
Given what you saw in the competitors, here's the model I'd lock in:

User plans (shown on landing page)

Free               $0         50 credits/mo     1 project      PDF export, watermark
Pro                $19.90     1,500 credits/mo  Unlimited projects   HD export, no watermark, top-ups allowed
Organization plans (shown only inside org workspace)

Starter (team)     $29/mo     3,000 credits/mo shared    5 seats    Brand kit, shared library
Business           $79/mo     12,000 credits/mo shared   15 seats   SSO, priority support, analytics
Top-ups (Pro and above, rollover)

500 credits       $5
2,000 credits     $18   (save 10%)
5,000 credits     $40   (save 20%)
Why these numbers work vs. competitors
You undercut Storyboarder.ai's $26 Starter at $19.90 Pro — you win the solo creator who otherwise picks them.
You beat Higgsfield's $9 Basic (150 credits) — your $19.90 Pro gives 10× credits. Feels generous.
Your $29 team Starter is nearly identical to Krock's $23.99 but includes AI, while Krock's AI is a side feature.
Credit rollover on top-ups (paid credits) is a differentiator vs. Higgsfield's hostile 90-day expiry.
Monthly credits DON'T roll over — matches Higgsfield, creates urgency, protects your margin.
Organization credits are shared — matches no one directly. This is your moat vs. per-seat competitors.
Three tactical takeaways from this competitive scan
Nobody shows User + Org plans on the same page. Boords doesn't. Storyboarder doesn't. Higgsfield doesn't. Krock doesn't. → Confirms your instinct from earlier — keep them separated by context.

The cheap plan is always a teaser, not the business. Higgsfield's $9 gets 150 credits — enough to try it, not enough to finish a project. Storyboarder's Trial is explicitly labeled "Trial." Your Free plan should feel the same: useful enough to love it, limited enough to upgrade.

The winning hook is "unlimited something." Boords: unlimited exports. Storyboarder: unlimited images. Krock: unlimited reviewers. → Pick one thing to make unlimited on Pro. Suggestion: unlimited projects + unlimited storyboard frames (since the actual cost is in AI generation, which is already metered by credits).

Want me to update lib/plan-config.ts and the landing page pricing cards in app/(marketing)/storytica/page.tsx:297-330 to this new model?