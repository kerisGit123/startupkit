$headers = @{
    "Content-Type" = "application/json"
    "x-webhook-secret" = "n8n-webhook-secret-2024"
}

$body = Get-Content "d:\gemini\startupkit\test-n8n-callback.json" | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/n8n-webhook" -Method POST -Headers $headers -Body $body

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content | ConvertFrom-Json)"
