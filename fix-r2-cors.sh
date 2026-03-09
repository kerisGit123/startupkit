# R2 CORS Configuration Script
# Use this to add CORS policy via Cloudflare API

# Replace with your actual values
ACCOUNT_ID="8ef343d05898fc86781d8897005c01f6"
BUCKET_NAME="storyboardbucket"
API_TOKEN="your-cloudflare-api-token"

# CORS policy JSON
cat > cors-policy.json << 'EOF'
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Apply CORS policy
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @cors-policy.json

echo "CORS policy applied! Wait 30-60 seconds for it to take effect."
