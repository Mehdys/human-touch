#!/bin/bash
# Test script with your actual tokens

AUTH_TOKEN="Bearer <YOUR_AUTH_TOKEN>"

PROVIDER_TOKEN="<YOUR_PROVIDER_TOKEN>"

echo "🧪 Testing Calendar Features"
echo "=============================="
echo ""

echo "📅 TEST 1: Calendar Analysis (get-availability)"
echo "------------------------------------------------"
echo "Fetching your real calendar events and finding free slots..."
echo ""

response=$(curl -s -X POST "https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/get-availability" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"provider_token\": \"$PROVIDER_TOKEN\"}")

echo "$response" | jq '.'

events_count=$(echo "$response" | jq -r '.eventsCount // 0')
free_slots_count=$(echo "$response" | jq -r '.freeSlots | length')
calendar_connected=$(echo "$response" | jq -r '.calendarConnected')

echo ""
echo "✅ Results:"
echo "   - Calendar connected: $calendar_connected"
echo "   - Events found: $events_count"
echo "   - Free slots: $free_slots_count"
echo ""

if [ "$free_slots_count" -gt "0" ]; then
    echo "📅 Your free slots:"
    echo "$response" | jq -r '.freeSlots[] | "   - \(.start | split("T")[0]) \(.start | split("T")[1] | split(".")[0]) → \(.end | split("T")[1] | split(".")[0]) (\(.duration) min)"'
fi

echo ""
echo "=============================="
echo "✅ Test Complete!"
echo ""
echo "Next steps:"
echo "1. Check the venue suggestions in the app (should now show Google Maps links)"
echo "2. Try planning a catchup to see AI venues with addresses"
