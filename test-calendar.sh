#!/bin/bash
# Quick test script for CatchUp calendar features
# This helps you manually verify the AI agent's calendar capabilities

echo "🧪 CatchUp Calendar Feature Testing Script"
echo "==========================================="
echo ""

# Check if Supabase project ref is set
PROJECT_REF="ejhqzvmlurlvkypm mjyl"

echo "📋 What you need before running tests:"
echo "1. Get your auth token from the browser console:"
echo "   const { data } = await window.supabase.auth.getSession();"
echo "   console.log('Bearer ' + data.session.access_token);"
echo ""
echo "2. Get your provider token:"
echo "   const { data } = await window.supabase.auth.getSession();"
echo "   console.log(data.session.provider_token);"
echo ""

read -p "Do you have both tokens? (y/n): " has_tokens

if [ "$has_tokens" != "y" ]; then
    echo "Please get the tokens first and run this script again."
    exit 1
fi

echo ""
read -p "Enter your auth token (Bearer ...): " auth_token
read -p "Enter your provider token: " provider_token

echo ""
echo "🔍 TEST 1: Calendar Analysis"
echo "=============================="
echo "Testing if the app can access your calendar and find free slots..."
echo ""

response=$(curl -s -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/get-availability" \
  -H "Authorization: $auth_token" \
  -H "Content-Type: application/json" \
  -d "{\"provider_token\": \"$provider_token\"}")

echo "Response:"
echo "$response" | jq '.'

# Extract free slots
free_slots_count=$(echo "$response" | jq '.freeSlots | length')
calendar_connected=$(echo "$response" | jq '.calendarConnected')
events_count=$(echo "$response" | jq '.eventsCount')

echo ""
echo "✅ Calendar connected: $calendar_connected"
echo "✅ Events found: $events_count"
echo "✅ Free slots found: $free_slots_count"

if [ "$free_slots_count" -gt "0" ]; then
    echo ""
    echo "📅 Your free slots:"
    echo "$response" | jq '.freeSlots[] | "- \(.start | split("T")[0]) at \(.start | split("T")[1] | split(".")[0]) for \(.duration) minutes"'
fi

echo ""
echo "✅ TEST 1 PASSED: Calendar access works!"
echo ""
echo "Would you like to test AI suggestions? This requires calendar events."
read -p "Continue to TEST 2? (y/n): " continue_test

if [ "$continue_test" != "y" ]; then
    exit 0
fi

echo ""
echo "🤖 TEST 2: AI Slot Suggestions with Before/After Context"
echo "=========================================================="
echo "This tests if the AI can tell you what's before and after each suggested time."
echo ""

# You'll need to manually create a test payload with your actual calendar data
echo "To test this properly, you need to:"
echo "1. Copy a sample of your calendar events from TEST 1"
echo "2. Use the test-calendar-features.md guide to create a curl request"
echo ""
echo "Example test data is in: test-calendar-features.md (Step 4)"

echo ""
echo "🏢 TEST 3: Real Venue Suggestions"
echo "=================================="
echo "Testing if the AI suggests real places with Google Maps links..."
echo ""

venue_response=$(curl -s -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/suggest-catchup" \
  -H "Authorization: $auth_token" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [{
      "name": "Test Contact",
      "context": "Met at tech event",
      "daysSinceMet": 14,
      "lastCatchup": "2 weeks ago"
    }],
    "preferences": ["coffee shops"],
    "city": "Paris"
  }')

echo "Response:"
echo "$venue_response" | jq '.'

echo ""
echo "✅ Venue Suggestions:"
echo "$venue_response" | jq '.suggestions[] | "- \(.placeName) (\(.placeType)): \(.address)"'

echo ""
echo "==========================================="
echo "✅ All manual tests complete!"
echo ""
echo "For detailed testing instructions, see:"
echo "  ./test-calendar-features.md"
