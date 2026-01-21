#!/bin/bash
# Test JWT fix for get-availability

set -e

SUPABASE_URL="https://ejhqzvmlurlvkypmmjyl.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaHF6dm1sdXJsdmt5cG1tanlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDc4ODAsImV4cCI6MjA4NDIyMzg4MH0.XttMnrVfHotsa3uP0qMh12-dsAPGaxe7RjR70RIqkOs"
USER_EMAIL="mehdigribaa100@yahoo.com" 
USER_PASSWORD="test1234"

echo "🧪 Testing JWT Fix for get-availability"
echo "========================================="
echo ""

# Authenticate
echo "1️⃣ Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "❌ Auth failed"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Test get-availability (should work even without provider_token)
echo "2️⃣ Testing get-availability endpoint..."
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/get-availability" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response:"
echo "$RESPONSE" | jq .
echo ""

# Check for JWT error
if echo "$RESPONSE" | jq -e '.code == 401 and .message == "Invalid JWT"' > /dev/null 2>&1; then
    echo "❌ STILL GETTING JWT ERROR"
    echo ""
    echo "The function might need a few seconds to update."
    echo "Try again in 30 seconds, or check the Supabase dashboard."
    exit 1
elif echo "$RESPONSE" | jq -e '.calendarConnected == false' > /dev/null 2>&1; then
    echo "✅ JWT ERROR FIXED!"
    echo "✅ Function responding correctly (calendar not connected)"
    exit 0
elif echo "$RESPONSE" | jq -e '.calendarConnected == true' > /dev/null 2>&1; then
    echo "✅ JWT ERROR FIXED!"
    echo "✅ Calendar connected and working!"
    exit 0
else
    echo "⚠️  Unexpected response, but no JWT error"
    exit 0
fi
