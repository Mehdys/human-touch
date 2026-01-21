#!/bin/bash

# Simple manual test flow - just copy and paste each command

cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║  🤖 Manual Terminal Test - AI Catchup Flow              ║
╚══════════════════════════════════════════════════════════╝

Follow these steps in order. Copy and paste each command.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Get your authentication token
--------------------------------------
1. Open http://localhost:5173 in your browser
2. Make sure you're logged in
3. Open Browser Console (Cmd+Option+I on Mac)
4. Run this code:

(async () => { 
  const { data } = await window.supabase.auth.getSession(); 
  console.log('AUTH_TOKEN="Bearer ' + data.session.access_token + '"');
  if (data.session.provider_token) {
    console.log('PROVIDER_TOKEN="' + data.session.provider_token + '"');
  }
})()

5. Copy the output and run it in this terminal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Once you have your tokens set, continue with:

STEP 2: Fetch your contacts
----------------------------
curl -s "https://ejhqzvmlurlvkypmmjyl.supabase.co/rest/v1/contacts?select=*&order=created_at.desc&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaHF6dm1sdXJsdmt5cG1tanlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDc4ODAsImV4cCI6MjA4NDIyMzg4MH0.XttMnrVfHotsa3uP0qMh12-dsAPGaxe7RjR70RIqkOs" \
  -H "Authorization: $AUTH_TOKEN" | jq -r '.[] | "• \(.name) - \(.context)"'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: Get calendar availability (if connected)
------------------------------------------------
curl -s -X POST "https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/get-availability" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"provider_token\": \"$PROVIDER_TOKEN\"}" | jq .

This will show:
  • Your upcoming calendar events
  • Free time slots
  • Calendar connection status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 4: Generate AI catchup suggestion
---------------------------------------
Pick a friend name from Step 2, then run:

curl -s -X POST "https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/suggest-catchup" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [{
      "name": "YOUR_FRIEND_NAME_HERE",
      "context": "colleague",
      "daysSinceMet": 30,
      "lastCatchup": null
    }],
    "preferences": ["cafe", "restaurant"],
    "city": "Paris"
  }' | jq .

This will show:
  • Personalized catchup suggestion
  • Venue recommendation with address
  • Google Maps search link
  • Optimal timeframe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready? Let's start!
After running Step 1, come back here and continue with the other steps.

EOF
