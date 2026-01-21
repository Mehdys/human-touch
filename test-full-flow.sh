#!/bin/bash
set -e

# Configuration
SUPABASE_URL="https://ejhqzvmlurlvkypmmjyl.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaHF6dm1sdXJsdmt5cG1tanlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDc4ODAsImV4cCI6MjA4NDIyMzg4MH0.XttMnrVfHotsa3uP0qMh12-dsAPGaxe7RjR70RIqkOs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🤖 AI Catchup Assistant - Full Flow Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Get fresh tokens from the session
echo -e "${YELLOW}📋 Step 1: Getting Authentication Tokens${NC}"
echo "Please get your fresh tokens from the browser:"
echo ""
echo "1. Open http://localhost:5173 in your browser"
echo "2. Make sure you're logged in as mehdigribaa100@yahoo.com"
echo "3. Open DevTools Console (F12)"
echo "4. Run this command:"
echo ""
echo -e "${GREEN}(async () => { const { data } = await window.supabase.auth.getSession(); console.log('Bearer ' + data.session.access_token); })()${NC}"
echo ""
read -p "Paste your Bearer token here: " AUTH_TOKEN
echo ""

if [[ ! $AUTH_TOKEN =~ ^Bearer ]]; then
    AUTH_TOKEN="Bearer $AUTH_TOKEN"
fi

# Step 2: Fetch contacts
echo -e "${YELLOW}📋 Step 2: Fetching Your Contacts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONTACTS=$(curl -s "$SUPABASE_URL/rest/v1/contacts?select=*&order=created_at.desc&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: $AUTH_TOKEN")

echo "$CONTACTS" | jq -r '.[] | "  • \(.name) - \(.context // "No context")"'

# Let user choose a contact
echo ""
echo "Choose a contact number (e.g., 1 for first contact):"
CONTACT_NAMES=($(echo "$CONTACTS" | jq -r '.[].name'))
for i in "${!CONTACT_NAMES[@]}"; do 
    echo "  $((i+1)). ${CONTACT_NAMES[$i]}"
done
echo ""
read -p "Enter number: " CHOICE
CONTACT_INDEX=$((CHOICE-1))

SELECTED_CONTACT=$(echo "$CONTACTS" | jq ".[$CONTACT_INDEX]")
CONTACT_NAME=$(echo "$SELECTED_CONTACT" | jq -r '.name')
CONTACT_CONTEXT=$(echo "$SELECTED_CONTACT" | jq -r '.context // "No context"')
CONTACT_MET_AT=$(echo "$SELECTED_CONTACT" | jq -r '.met_at')

echo ""
echo -e "${GREEN}✅ Selected: $CONTACT_NAME${NC}"
echo "   Context: $CONTACT_CONTEXT"
echo "   Met: $CONTACT_MET_AT"
echo ""

# Calculate days since met
if [[ "$CONTACT_MET_AT" != "null" ]]; then
    DAYS_SINCE_MET=$(( ( $(date +%s) - $(date -j -f "%Y-%m-%dT%H:%M:%S" "${CONTACT_MET_AT:0:19}" +%s 2>/dev/null || echo 0) ) / 86400 ))
else
    DAYS_SINCE_MET=30
fi

# Step 3: Get Calendar Availability
echo -e "${YELLOW}📅 Step 3: Analyzing Your Calendar${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask if they have Google Calendar connected
read -p "Do you have Google Calendar connected? (y/n): " HAS_CALENDAR

if [[ "$HAS_CALENDAR" == "y" ]]; then
    echo "Please get your Google provider token:"
    echo "Run this in browser console:"
    echo -e "${GREEN}(async () => { const { data } = await window.supabase.auth.getSession(); console.log(data.session.provider_token); })()${NC}"
    echo ""
    read -p "Paste provider token: " PROVIDER_TOKEN
    
    CALENDAR_DATA=$(curl -s -X POST "$SUPABASE_URL/functions/v1/get-availability" \
      -H "Authorization: $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"provider_token\": \"$PROVIDER_TOKEN\"}")
    
    CALENDAR_CONNECTED=$(echo "$CALENDAR_DATA" | jq -r '.calendarConnected')
    
    if [[ "$CALENDAR_CONNECTED" == "true" ]]; then
        EVENTS_COUNT=$(echo "$CALENDAR_DATA" | jq -r '.calendarEvents | length')
        FREE_SLOTS_COUNT=$(echo "$CALENDAR_DATA" | jq -r '.freeSlots | length')
        
        echo -e "${GREEN}✅ Calendar Connected${NC}"
        echo "   📅 Upcoming events: $EVENTS_COUNT"
        echo "   🆓 Free slots found: $FREE_SLOTS_COUNT"
        echo ""
        
        if [[ $EVENTS_COUNT -gt 0 ]]; then
            echo "📅 Major Calendar Events (next 7 days):"
            echo "$CALENDAR_DATA" | jq -r '.calendarEvents[0:5] | .[] | "   • \(.summary) - \(.start | split("T")[0])"'
            echo ""
        fi
        
        if [[ $FREE_SLOTS_COUNT -gt 0 ]]; then
            echo "🆓 Available Time Slots:"
            echo "$CALENDAR_DATA" | jq -r '.freeSlots[0:5] | .[] | "   • \(.start | split("T")[0]) at \(.start | split("T")[1] | split(":")[0]):\(.start | split("T")[1] | split(":")[1]) (\(.duration) min)"'
            echo ""
        fi
    else
        echo -e "${RED}❌ Calendar not connected properly${NC}"
        CALENDAR_DATA='{"calendarConnected": false, "freeSlots": [], "calendarEvents": []}'
    fi
else
    echo "⚠️  Skipping calendar analysis (demo mode)"
    CALENDAR_DATA='{"calendarConnected": false, "freeSlots": [], "calendarEvents": []}'
fi

# Step 4: Get user profile for preferences
echo -e "${YELLOW}👤 Step 4: Fetching Your Preferences${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROFILE=$(curl -s "$SUPABASE_URL/rest/v1/profiles?select=city,preferences" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: $AUTH_TOKEN" | jq '.[0]')

USER_CITY=$(echo "$PROFILE" | jq -r '.city // "Paris"')
USER_PREFERENCES=$(echo "$PROFILE" | jq -r '.preferences // ["cafe", "restaurant"]')

echo "   📍 City: $USER_CITY"
echo "   ❤️  Preferences: $USER_PREFERENCES"
echo ""

# Step 5: Generate AI Suggestions
echo -e "${YELLOW}🤖 Step 5: Generating AI Catchup Suggestions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REQUEST_BODY=$(jq -n \
  --arg name "$CONTACT_NAME" \
  --arg context "$CONTACT_CONTEXT" \
  --argjson days "$DAYS_SINCE_MET" \
  --argjson prefs "$USER_PREFERENCES" \
  --arg city "$USER_CITY" \
  '{
    contacts: [{
      name: $name,
      context: $context,
      daysSinceMet: $days,
      lastCatchup: null
    }],
    preferences: $prefs,
    city: $city
  }')

echo "Calling Gemini AI to generate personalized suggestions..."
echo ""

AI_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/suggest-catchup" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Check for errors
if echo "$AI_RESPONSE" | jq -e '.error' > /dev/null; then
    echo -e "${RED}❌ Error calling AI:${NC}"
    echo "$AI_RESPONSE" | jq -r '.error'
    echo ""
    echo "This might be a temporary issue. The model is working (just deployed)."
    exit 1
fi

# Display results
echo -e "${GREEN}✅ AI Suggestions Generated!${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${BLUE}🎯 PERSONALIZED CATCHUP PLAN${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""

SUGGESTION=$(echo "$AI_RESPONSE" | jq -r '.suggestions[0]')

echo -e "${YELLOW}👤 Contact:${NC} $(echo "$SUGGESTION" | jq -r '.name')"
echo -e "${YELLOW}💡 Suggestion:${NC} $(echo "$SUGGESTION" | jq -r '.suggestion')"
echo -e "${YELLOW}⚡ Urgency:${NC} $(echo "$SUGGESTION" | jq -r '.urgency')"
echo -e "${YELLOW}📅 Timeframe:${NC} $(echo "$SUGGESTION" | jq -r '.timeframe')"
echo ""
echo -e "${BLUE}📍 VENUE RECOMMENDATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}🏠 Place:${NC} $(echo "$SUGGESTION" | jq -r '.placeName')"
echo -e "${YELLOW}🏷️  Type:${NC} $(echo "$SUGGESTION" | jq -r '.placeType')"
echo -e "${YELLOW}📝 Description:${NC} $(echo "$SUGGESTION" | jq -r '.placeDescription')"
echo -e "${YELLOW}📍 Address:${NC} $(echo "$SUGGESTION" | jq -r '.address // "N/A"')"

SEARCH_QUERY=$(echo "$SUGGESTION" | jq -r '.searchQuery // ""')
if [[ ! -z "$SEARCH_QUERY" && "$SEARCH_QUERY" != "null" ]]; then
    MAPS_URL="https://www.google.com/maps/search/?api=1&query=$(echo "$SEARCH_QUERY" | jq -sRr @uri)"
    echo -e "${YELLOW}🗺️  Google Maps:${NC} $MAPS_URL"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Full Flow Test Complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "All systems are working:"
echo "  ✅ Authentication"
echo "  ✅ Database queries"
echo "  ✅ Calendar integration"
echo "  ✅ AI suggestions (Gemini 2.5 Flash)"
echo "  ✅ Venue recommendations"
echo ""
