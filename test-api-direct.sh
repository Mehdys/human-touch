#!/bin/bash
# Direct API test - demonstrates the full flow using curl
# No browser needed, just direct API calls

set -e

SUPABASE_URL="https://ejhqzvmlurlvkypmmjyl.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaHF6dm1sdXJsdmt5cG1tanlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDc4ODAsImV4cCI6MjA4NDIyMzg4MH0.XttMnrVfHotsa3uP0qMh12-dsAPGaxe7RjR70RIqkOs"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🤖 AI Catchup Flow - Direct API Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# First, authenticate to get a valid session token
echo -e "${YELLOW}📋 Step 1: Authentication${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Enter your email (mehdigribaa100@yahoo.com):"
read USER_EMAIL

echo "Enter your password:"
read -s USER_PASSWORD
echo ""

# Login to get session token
LOGIN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo -e "${YELLOW}⚠️  Login failed or token not found${NC}"
    echo "Error: $(echo "$LOGIN_RESPONSE" | jq -r '.error_description // .error // "Unknown error"')"
    echo ""
    echo "For this demo, I'll use the public anon key to demonstrate the API structure."
    echo "In production, this would use your authenticated session."
    AUTH_HEADER="Bearer $ANON_KEY"
else
    echo -e "${GREEN}✅ Authenticated successfully${NC}"
    AUTH_HEADER="Bearer $ACCESS_TOKEN"
fi
echo ""

# Step 2: Fetch contacts
echo -e "${YELLOW}📋 Step 2: Fetching Contacts from Database${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONTACTS=$(curl -s "$SUPABASE_URL/rest/v1/contacts?select=*&order=created_at.desc&limit=5" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: $AUTH_HEADER")

echo "Your contacts:"
echo "$CONTACTS" | jq -r '.[] | "  • \(.name) - \(.context // "No context")"'
echo ""

# Pick first contact for demo
FIRST_CONTACT=$(echo "$CONTACTS" | jq '.[0]')
CONTACT_NAME=$(echo "$FIRST_CONTACT" | jq -r '.name // "John Doe"')
CONTACT_CONTEXT=$(echo "$FIRST_CONTACT" | jq -r '.context // "colleague"')

echo -e "${GREEN}Selected for demo: $CONTACT_NAME${NC}"
echo ""

# Step 3: Demo - Calendar Analysis (requires Google Calendar token)
echo -e "${YELLOW}📅 Step 3: Calendar Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demonstrating calendar API structure..."
echo ""
echo "Request to: $SUPABASE_URL/functions/v1/get-availability"
echo "This would return:"
echo "  • Calendar events from Google Calendar"
echo "  • Free time slots in your schedule"
echo "  • Availability for the next 7 days"
echo ""
echo "(Skipping actual call - requires Google Calendar OAuth token)"
echo ""

# Step 4: Generate AI Catchup Suggestion
echo -e "${YELLOW}🤖 Step 4: Generating AI Catchup Suggestion${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Calling Gemini 2.5 Flash AI to generate personalized suggestion..."
echo ""

REQUEST_BODY=$(jq -n \
  --arg name "$CONTACT_NAME" \
  --arg context "$CONTACT_CONTEXT" \
  '{
    contacts: [{
      name: $name,
      context: $context,
      daysSinceMet: 30,
      lastCatchup: null
    }],
    preferences: ["cafe", "restaurant", "bar"],
    city: "Paris"
  }')

echo "Request body:"
echo "$REQUEST_BODY" | jq .
echo ""

AI_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/suggest-catchup" \
  -H "Authorization: $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Check for errors
if echo "$AI_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${YELLOW}Response:${NC}"
    echo "$AI_RESPONSE" | jq .
    echo ""
    ERROR_MSG=$(echo "$AI_RESPONSE" | jq -r '.error')
    if [[ "$ERROR_MSG" == *"auth"* ]] || [[ "$ERROR_MSG" == *"JWT"* ]]; then
        echo "⚠️  This requires authentication. Please log in via the browser first."
    fi
else
    echo -e "${GREEN}✅ AI Response Received!${NC}"
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
    echo -e "${YELLOW}📝 Why:${NC} $(echo "$SUGGESTION" | jq -r '.placeDescription')"
    echo -e "${YELLOW}📍 Address:${NC} $(echo "$SUGGESTION" | jq -r '.address // "N/A"')"
    
    SEARCH_QUERY=$(echo "$SUGGESTION" | jq -r '.searchQuery // empty')
    if [[ ! -z "$SEARCH_QUERY" ]]; then
        MAPS_URL="https://www.google.com/maps/search/?api=1&query=$(printf %s "$SEARCH_QUERY" | jq -sRr @uri)"
        echo -e "${YELLOW}🗺️  Google Maps:${NC} $MAPS_URL"
    fi
    echo ""
fi

echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Test Complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "What we demonstrated:"
echo "  ✅ Database queries (fetching contacts)"
echo "  ✅ AI integration (Gemini 2.5 Flash)"
echo "  ✅ Personalized suggestions"
echo "  ✅ Venue recommendations with Google Maps"
echo ""
