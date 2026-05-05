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











生死之间

（verse 1）
你走后的每个夜晚
月光还是照着窗前
我一个人坐在老地方
好像你从没走远

（chorus）
生是相遇 死是别离
中间那段叫做珍惜
我记得你笑的样子
一辈子都忘不去

（verse 2）
那件旧衣还挂在门后
带着你淡淡的气息
邻居问我为何不收
我说 他还会回来的

（chorus）
生是相遇 死是别离
中间那段叫做珍惜
等我也走到那一天
再牵你的手不放弃

（outro）
风轻轻吹过脸庞
像你在说 别哭了……


this is my project, I would like to make a customer support chat bot using Anthropic api key Haiku, I want to supply initial customer support guideline prompt to huiku, then proceed to build a few backend api for Haiku to access internal data to answer customer request. tell me what I need to supply to you. first, setup the anthropic api access engine, next setup the api access for the haiku customer support agent. next , build a demo sample chat interface to test the chat bot. do the development planning, do miss anything else, please ask me in the next response. no coding yet, let discuss the overall strategy before doing any coding.




modal : ai-music-api/generate
Pricing: Generate Music costs 12 credits per request (≈ $0.06). 
High-tier top-ups (+10% bonus) bring effective pricing down to ~$0.054 per request.



modal : ai-music-api/extend
Pricing: Extend Music costs 12 credits per request (≈ $0.06).
High-tier top-ups (+10% bonus) bring effective pricing down to ~$0.054 per request


modal : ai-music-api/generate-persona
Pricing: Generate Persona is free.

modal : ai-music-api/upload-and-cover-audio
Pricing: Upload and Cover Audio costs 12.0 credits per request (≈ $0.06). 
High-tier top-ups (+10% bonus) bring effective pricing down to ~$0.054 per request.




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




1. End-to-end testing (highest ROI)
Three major features have never been tested: Agent Mode ("build me a 6-frame story about X"), Visual Lock (analyze → review → apply), and the element @mention auto-insert pipeline. Any one of these could have silent bugs that users will hit immediately.

2. Agent Mode quick-create (most impactful feature)
The todo shows Phase 2 ("type one sentence → storyboard done") is ready to build now that Phase 1 tools exist. This is the key newbie hook — biggest conversion driver you don't have yet. , what left testing is 










margin warm , margin cold ? what u means ? why 1m story cinematic only break even how about 2m , 5m? for haiku do we make money what is our margin? margin warm means ? if margin are warn cache we are making 75% ? raise to 10cr ?  should we fix it 8 credit / min keep it simple can this make money? u mean sonnet need to use 18 cr / min ? The biggest single-point failure is: SSE connection drops mid-invoke_skill (30-60 second blocking call). If the browser tab goes background, mobile network switches, or corporate firewall kills idle connections, the generation is lost. The auto-save in invoke_skill saves the script even if the SSE dies, but the client won't know it succeeded.

Production hardening needed before scale: a polling fallback or a job-status Convex query the client can check after reconnect. how you going to solve this.  how you know we can do 	20-60 min ?



























Yes. Since your current template is written around “table size,” the key change for a **universal size** version is to remove fixed scale assumptions and make the prompt preserve **true real-world proportions regardless of whether the object is tiny, handheld, furniture-sized, or large industrial equipment**.

Here is a refined universal version you can reuse.

# Photorealistic Universal Object Identity Sheet

### Prompt

Create a **photorealistic object identity sheet** showing the **same real-world physical object photographed from multiple angles**.

The result must look like **real product-style photography captured during a single reference session**, not a CGI model, 3D render, stylized illustration, or concept art.

The object must remain fully consistent across all images in:

* shape and proportions
* materials and surface textures
* color and finish
* thickness and construction
* wear, scratches, manufacturing marks, and natural imperfections

The images should feel like **real photographic documentation of one physical object used as professional reference material**.

Use **neutral lighting, realistic camera optics, and natural photographic behavior**.

---

## Universal Scale Rule

The object may be **small, handheld, medium-sized, large, or oversized**.

The photography must **adapt naturally to the object’s real-world size**.

Use framing, camera distance, lens behavior, and composition appropriate to the object's scale while preserving accurate proportions.

Do **not** artificially shrink, enlarge, redesign, or normalize the object.

The object should always feel like **a believable physical object photographed in real space**.

---

# Layout

Create a **clean reference contact sheet** arranged in **two horizontal rows**.

All images must depict **the exact same object photographed during the same session under identical lighting conditions**.

---

# Top Row — Structural Orientation (4 images)

### 1. Front view

Object facing directly toward camera.

### 2. Left perspective view

Slightly angled to reveal depth and side structure.

### 3. Right perspective view

Opposite angle showing the other side.

### 4. Rear view

Back side of the object.

**Purpose:**
These views establish **overall geometry, silhouette, structure, and proportions**.

---

# Bottom Row — Detail & Material References (3 images)

### 1. Functional or primary surface view

The most recognizable, functional, or defining surface of the object.

### 2. Material / texture close-up

A closer view showing material grain, surface texture, wear, or construction detail.

### 3. Light interaction view

A view showing how light reacts with the material surface:

* reflections
* matte diffusion
* gloss
* metallic highlights
* roughness

**Purpose:**
These images communicate **material realism, finish quality, and small-scale physical details**.

---

# Object Composition Rules

Preserve the **true physical structure and proportions** of the object.

Maintain consistency in:

* geometry
* scale
* material behavior
* color tone
* surface imperfections

Do not alter, redesign, stylize, or reinterpret the object between images.

All images must feel like **multiple photographs of the same physical object captured from different angles**.

---

# Background

Use a **simple neutral photographic environment** appropriate to the object’s size.

Possible environments include:

* neutral studio backdrop
* tabletop surface
* seamless background
* clean floor or neutral staging area for larger objects

The background should remain **subtle, minimal, and non-dominant**.

---

# Lighting & Camera

Use **realistic photographic conditions**:

* soft neutral studio lighting
* gentle shadows
* natural reflections
* realistic camera perspective
* physically believable depth of field

The camera framing should adapt naturally to the object’s scale.

Avoid:

* dramatic cinematic lighting
* stylized lighting effects
* exaggerated reflections
* unrealistic lens distortion

---

# Consistency Constraints

The object must remain **identical across all images**.

Maintain consistent:

* shape
* proportions
* material appearance
* scale
* color tone
* wear and imperfections

All photographs must appear as though they were captured **during one real photography session of the same physical object**.

---

# Critical Restrictions

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

The result must resemble **real photographic documentation of a physical object**.




for the elements generation , the system should identity with prompt template is using 


what it have is character , props , environment 
prop detail if have 
color palette , prop notes , character notes , theme & tone
environment / set design 
floor plan / top down plan
storyboard : cut 1, cut 2, cut 3, cut4 ,cut 5( if have )
lighting / mood/ style notes 
cinematography notes
mood keywords
lens/style notes
floor plan legend
cut count 
environment fingerprint



for face uncon