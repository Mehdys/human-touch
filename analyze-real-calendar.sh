#!/bin/bash
# Fetch and analyze real Google Calendar data

set -e

SUPABASE_URL="https://ejhqzvmlurlvkypmmjyl.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaHF6dm1sdXJsdmt5cG1tanlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDc4ODAsImV4cCI6MjA4NDIyMzg4MH0.XttMnrVfHotsa3uP0qMh12-dsAPGaxe7RjR70RIqkOs"
USER_EMAIL="mehdigribaa100@yahoo.com"
USER_PASSWORD="test1234"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  📅 Real Google Calendar Analysis                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Authenticate
echo -e "${YELLOW}🔐 Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')
PROVIDER_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.user.user_metadata.provider_token // .session.provider_token // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated as: $USER_EMAIL${NC}"
echo ""

# Check if we have Google Calendar access
if [[ -z "$PROVIDER_TOKEN" ]]; then
    echo -e "${YELLOW}⚠️  No Google Calendar connected${NC}"
    echo ""
    echo "To connect your calendar:"
    echo "1. Open the app: http://localhost:8081/"
    echo "2. Sign in with Google"
    echo "3. Grant calendar permissions"
    echo ""
    echo "For now, showing profile information..."
    echo ""
    
    # Fetch user profile
    PROFILE=$(curl -s "$SUPABASE_URL/rest/v1/profiles?select=*" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}User Profile:${NC}"
    echo "$PROFILE" | jq .
    
    exit 0
fi

echo -e "${CYAN}📡 Provider Token Found: ${PROVIDER_TOKEN:0:20}...${NC}"
echo ""

# Step 2: Fetch Calendar Availability
echo -e "${YELLOW}📅 Fetching your Google Calendar...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CALENDAR_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/get-availability" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"provider_token\":\"$PROVIDER_TOKEN\"}")

# Check for errors
if echo "$CALENDAR_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to fetch calendar${NC}"
    echo "Error: $(echo "$CALENDAR_RESPONSE" | jq -r '.error')"
    echo ""
    echo "Full response:"
    echo "$CALENDAR_RESPONSE" | jq .
    exit 1
fi

echo -e "${GREEN}✅ Calendar data retrieved!${NC}"
echo ""

# Extract data
EVENTS_COUNT=$(echo "$CALENDAR_RESPONSE" | jq -r '.eventsCount // 0')
FREE_SLOTS_COUNT=$(echo "$CALENDAR_RESPONSE" | jq -r '.freeSlots | length // 0')
CALENDAR_EVENTS=$(echo "$CALENDAR_RESPONSE" | jq -r '.calendarEvents // []')

echo "╔════════════════════════════════════════════════════════╗"
echo -e "  ${BLUE}📊 CALENDAR OVERVIEW${NC}"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Total Events (next 7 days):${NC} $EVENTS_COUNT"
echo -e "${CYAN}Free Slots Available:${NC} $FREE_SLOTS_COUNT"
echo ""

# Display events
if [[ "$EVENTS_COUNT" -gt 0 ]]; then
    echo "╔════════════════════════════════════════════════════════╗"
    echo -e "  ${BLUE}📅 YOUR UPCOMING EVENTS${NC}"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    echo "$CALENDAR_EVENTS" | jq -r '.[] | 
        "🗓️  \(.summary // "No title")
    📅 \(.start[0:10]) at \(.start[11:16])
    ⏱️  Duration: \((.end | fromdate) - (.start | fromdate) | . / 60 | floor) minutes
    " + (if .description then "📝 \(.description[0:100])" else "" end) + "
    "'
else
    echo -e "${YELLOW}No events found in the next 7 days${NC}"
fi

# Display free slots
if [[ "$FREE_SLOTS_COUNT" -gt 0 ]]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo -e "  ${BLUE}⚡ YOUR FREE TIME SLOTS${NC}"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    echo "$CALENDAR_RESPONSE" | jq -r '.freeSlots[] | 
        "✨ \(.start[0:10]) | \(.start[11:16]) - \(.end[11:16])
    Duration: \(.duration) minutes
    "'
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo -e "${GREEN}║  ✅ CALENDAR ANALYSIS COMPLETE                       ║${NC}"
echo "╚════════════════════════════════════════════════════════╝"

# Save to file
echo "$CALENDAR_RESPONSE" | jq . > calendar_analysis.json
echo ""
echo "📄 Full calendar data saved to: calendar_analysis.json"
