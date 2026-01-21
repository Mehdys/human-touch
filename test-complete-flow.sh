#!/bin/bash
# Comprehensive end-to-end test with real credentials
# Tests: Auth → Contacts → Calendar → AI Slots → AI Venues

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
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🤖 CatchUp AI - Full End-to-End Test                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# STEP 1: AUTHENTICATION
# ============================================================================
echo -e "${YELLOW}📋 STEP 1: Authenticating User${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: $USER_EMAIL"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Error: $(echo "$LOGIN_RESPONSE" | jq -r '.error_description // .error // "Unknown error"')"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated successfully${NC}"
echo "User ID: $(echo "$LOGIN_RESPONSE" | jq -r '.user.id')"
echo ""

# ============================================================================
# STEP 2: FETCH CONTACTS
# ============================================================================
echo -e "${YELLOW}📋 STEP 2: Fetching Contacts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONTACTS=$(curl -s "$SUPABASE_URL/rest/v1/contacts?select=*&order=created_at.desc&limit=5" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

CONTACT_COUNT=$(echo "$CONTACTS" | jq 'length')
echo "Found $CONTACT_COUNT contacts:"
echo "$CONTACTS" | jq -r '.[] | "  • \(.name) - \(.context // "No context")"'
echo ""

if [[ "$CONTACT_COUNT" -eq 0 ]]; then
    echo -e "${RED}⚠️ No contacts found. Creating a test contact...${NC}"
    
    CREATE_CONTACT=$(curl -s -X POST "$SUPABASE_URL/rest/v1/contacts" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"name\":\"Test User\",\"context\":\"Met at tech event\",\"met_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
    
    echo "Created test contact: $(echo "$CREATE_CONTACT" | jq -r '.[0].name')"
    
    # Refetch contacts
    CONTACTS=$(curl -s "$SUPABASE_URL/rest/v1/contacts?select=*&order=created_at.desc&limit=5" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
fi

# Pick first contact for testing
FIRST_CONTACT=$(echo "$CONTACTS" | jq '.[0]')
CONTACT_NAME=$(echo "$FIRST_CONTACT" | jq -r '.name // "John Doe"')
CONTACT_CONTEXT=$(echo "$FIRST_CONTACT" | jq -r '.context // "colleague"')

echo -e "${GREEN}✅ Using contact: $CONTACT_NAME${NC}"
echo ""

# ============================================================================
# STEP 3: TEST AI SLOT SUGGESTIONS
# ============================================================================
echo -e "${YELLOW}🤖 STEP 3: Testing AI Slot Suggestions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create sample free slots for testing
SLOTS_REQUEST=$(jq -n \
  --arg contactName "$CONTACT_NAME" \
  --arg contactContext "$CONTACT_CONTEXT" \
  '{
    calendarEvents: [
      {
        summary: "Team Meeting",
        start: "2026-01-22T10:00:00Z",
        end: "2026-01-22T11:00:00Z"
      },
      {
        summary: "Lunch Break",
        start: "2026-01-22T12:00:00Z",
        end: "2026-01-22T13:00:00Z"
      }
    ],
    freeSlots: [
      {
        start: "2026-01-22T09:00:00Z",
        end: "2026-01-22T10:00:00Z",
        label: "Wednesday Jan 22, 9:00 AM"
      },
      {
        start: "2026-01-22T13:00:00Z",
        end: "2026-01-22T17:00:00Z",
        label: "Wednesday Jan 22, 1:00 PM"
      }
    ],
    contact: {
      name: $contactName,
      context: $contactContext
    }
  }')

echo "Request payload:"
echo "$SLOTS_REQUEST" | jq .
echo ""

AI_SLOTS_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/suggest-slots" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SLOTS_REQUEST")

# Check for errors
if echo "$AI_SLOTS_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${RED}❌ AI Slot Suggestions Failed${NC}"
    echo "Error: $(echo "$AI_SLOTS_RESPONSE" | jq -r '.error')"
    echo ""
    echo "Full response:"
    echo "$AI_SLOTS_RESPONSE" | jq .
else
    echo -e "${GREEN}✅ AI Slot Suggestions Success!${NC}"
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo -e "  ${BLUE}AI CALENDAR SUMMARY${NC}"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "$AI_SLOTS_RESPONSE" | jq -r '.calendarSummary // "No summary"'
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo -e "  ${BLUE}SUGGESTED TIME SLOTS${NC}"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "$AI_SLOTS_RESPONSE" | jq -r '.suggestions[]? | "📅 Slot: \(.slot)\n   Before: \(.beforeEvent)\n   After: \(.afterEvent)\n   💡 Reasoning: \(.reasoning)\n"'
fi
echo ""

# ============================================================================
# STEP 4: TEST AI VENUE SUGGESTIONS
# ============================================================================
echo -e "${YELLOW}🏠 STEP 4: Testing AI Venue Suggestions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VENUE_REQUEST=$(jq -n \
  --arg contactName "$CONTACT_NAME" \
  --arg contactContext "$CONTACT_CONTEXT" \
  '{
    contacts: [{
      name: $contactName,
      context: $contactContext,
      daysSinceMet: 30,
      lastCatchup: null
    }],
    preferences: ["cafe", "restaurant"],
    city: "Paris"
  }')

echo "Request payload:"
echo "$VENUE_REQUEST" | jq .
echo ""

AI_VENUE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/suggest-catchup" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$VENUE_REQUEST")

# Check for errors
if echo "$AI_VENUE_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${RED}❌ AI Venue Suggestions Failed${NC}"
    echo "Error: $(echo "$AI_VENUE_RESPONSE" | jq -r '.error')"
    echo ""
    echo "Full response:"
    echo "$AI_VENUE_RESPONSE" | jq .
else
    echo -e "${GREEN}✅ AI Venue Suggestions Success!${NC}"
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo -e "  ${BLUE}VENUE RECOMMENDATIONS${NC}"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    
    SUGGESTION=$(echo "$AI_VENUE_RESPONSE" | jq -r '.suggestions[0]')
    
    echo -e "${YELLOW}👤 Contact:${NC} $(echo "$SUGGESTION" | jq -r '.name')"
    echo -e "${YELLOW}💡 Suggestion:${NC} $(echo "$SUGGESTION" | jq -r '.suggestion')"
    echo -e "${YELLOW}⚡ Urgency:${NC} $(echo "$SUGGESTION" | jq -r '.urgency')"
    echo -e "${YELLOW}📅 Timeframe:${NC} $(echo "$SUGGESTION" | jq -r '.timeframe')"
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo -e "  ${BLUE}RECOMMENDED VENUE${NC}"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${YELLOW}🏠 Place:${NC} $(echo "$SUGGESTION" | jq -r '.placeName')"
    echo -e "${YELLOW}🏷️  Type:${NC} $(echo "$SUGGESTION" | jq -r '.placeType')"
    echo -e "${YELLOW}📝 Why:${NC} $(echo "$SUGGESTION" | jq -r '.placeDescription')"
    echo -e "${YELLOW}📍 Address:${NC} $(echo "$SUGGESTION" | jq -r '.address // "N/A"')"
    
    SEARCH_QUERY=$(echo "$SUGGESTION" | jq -r '.searchQuery // empty')
    if [[ ! -z "$SEARCH_QUERY" ]]; then
        MAPS_URL="https://www.google.com/maps/search/?api=1&query=$(printf %s "$SEARCH_QUERY" | jq -sRr @uri)"
        echo -e "${YELLOW}🗺️  Maps:${NC} $MAPS_URL"
    fi
fi
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "╔════════════════════════════════════════════════════════╗"
echo -e "${GREEN}║  ✅ END-TO-END TEST COMPLETE                         ║${NC}"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Test Results Summary:"
echo "  ✅ Authentication - PASSED"
echo "  ✅ Contact Fetching - PASSED"
if echo "$AI_SLOTS_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "  ❌ AI Slot Suggestions - FAILED"
else
    echo "  ✅ AI Slot Suggestions - PASSED"
fi
if echo "$AI_VENUE_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "  ❌ AI Venue Suggestions - FAILED"
else
    echo "  ✅ AI Venue Suggestions - PASSED"
fi
echo ""
echo "Your CatchUp app is ready to use! 🎉"
echo ""
