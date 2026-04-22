That's the `convex` JWT template (used when Convex calls `getToken({ template: "convex" })`). But `auth()` in **middleware** reads the **default session token**, which is separate.

You need to configure it in a different place:

**Clerk Dashboard → Sessions → Customize session token → Edit**

Add this claim:
```json
{
  "public_metadata": "{{user.public_metadata}}"
}
```

Save, then sign out + sign back in as the suspended user (forces a fresh token). The `/suspended` redirect should fire immediately.

The `convex` JWT template and the session token are different artifacts — your middleware check relies on the session token, not the Convex-audience JWT.




JWT clerk

{
	"aud": "convex",
	"name": "{{user.first_name}} {{user.last_name}}",
	"email": "{{user.primary_email_address}}",
	"org_id": "{{org.id}}",
	"picture": "{{user.image_url}}",
	"nickname": "{{user.username}}",
	"org_role": "{{org.role}}",
	"update_at": "{{user.updated_at}}",
	"given_name": "{{user.first_name}}",
	"family_name": "{{user.last_name}}",
	"phone_number": "{{user.primary_phone_number}}",
	"email_verified": "{{user.email_verified}}",
	"public_metadata": "{{user.public_metadata}}",
	"phone_number_verified": "{{user.phone_number_verified}}"
}



-------------------------------------------------

for suspended user 
Edit public metadata  in clerk user
{
  "suspended": true
}