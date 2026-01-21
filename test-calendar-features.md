# CatchUp Calendar AI Agent Testing Guide

## Overview
This guide helps you manually test the AI agent's calendar integration capabilities from the terminal.

## What the AI Agent Does

### 1. **Calendar Analysis** (`get-availability`)
- ✅ Accesses your Google Calendar via OAuth token
- ✅ Fetches all events for the next 7 days
- ✅ Analyzes your schedule hour-by-hour
- ✅ Finds free slots of 60+ minutes between 9 AM - 9 PM
- ✅ Returns top 5 available slots

### 2. **AI Slot Suggestions** (`suggest-slots`)
- ✅ Uses Google Gemini 1.5 Flash AI
- ✅ Reads your calendar events (what's before/after)
- ✅ Generates conversational summary of your week
- ✅ Suggests optimal times with contextual reasoning
- ✅ Examples: "I see you have a Team Meeting on Monday. Perfect timing would be Tuesday 7 PM after your dinner reservation wraps up."

### 3. **Real Venue Recommendations** (`suggest-catchup`)
- ✅ Suggests REAL places in your city (not generic)
- ✅ Provides Google Maps search query
- ✅ Includes place name, address, type, and description
- ✅ Examples: "Starbucks on Main St" instead of "a coffee shop"

### 4. **Calendar Event Creation** (`create-calendar-event`)
- ✅ Creates events in your Google Calendar
- ✅ Adds title, description, location, time
- ✅ Sets reminders (60 min & 15 min before)
- ✅ Returns event link

## Terminal Testing Steps

### Prerequisites
You need to be authenticated in the app with Google Calendar access to get your auth token.

### Step 1: Get Your Auth Token

1. Open the browser dev console (F12) on http://localhost:8081/
2. Go to Application/Storage → Local Storage
3. Look for Supabase auth data or run this in console:
```javascript
// Get auth token from Supabase
const { data } = await window.supabase.auth.getSession();
console.log('Bearer ' + data.session.access_token);
```
4. Copy the full "Bearer ..." token

### Step 2: Get Your Provider Token (Google OAuth)

```javascript
// Get provider token for Google Calendar API
const { data } = await window.supabase.auth.getSession();
console.log('Provider Token:', data.session.provider_token);
```

### Step 3: Test Calendar Analysis

```bash
# Replace YOUR_AUTH_TOKEN and YOUR_PROVIDER_TOKEN
curl -X POST https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/get-availability \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider_token": "YOUR_PROVIDER_TOKEN"}'
```

**Expected Output:**
```json
{
  "freeSlots": [
    {
      "start": "2026-01-21T14:00:00.000Z",
      "end": "2026-01-21T17:00:00.000Z",
      "duration": 180
    }
  ],
  "calendarConnected": true,
  "eventsCount": 12
}
```

**What to Verify:**
- ✅ Returns your actual free slots
- ✅ Shows correct number of calendar events
- ✅ Slots are at least 60 minutes
- ✅ Slots are between 9 AM - 9 PM

### Step 4: Test AI Slot Suggestions with Context

First, you need the calendar events and free slots from Step 3. Then:

```bash
curl -X POST https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/suggest-slots \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendarEvents": [
      {"start": "2026-01-21T10:00:00Z", "summary": "Team Meeting"},
      {"start": "2026-01-21T19:00:00Z", "summary": "Dinner"}
    ],
    "freeSlots": [
      {"start": "2026-01-21T14:00:00Z", "end": "2026-01-21T17:00:00Z", "label": "Tue Jan 21, 2:00 PM"}
    ],
    "contact": {
      "name": "John Doe",
      "context": "Met at startup event"
    }
  }'
```

**Expected Output:**
```json
{
  "calendarSummary": "I see you have a Team Meeting on Monday and Dinner on Tuesday. Here's when I think works best:",
  "suggestions": [
    {
      "slot": "Tue Jan 21, 2:00 PM",
      "reasoning": "Perfect timing after your Team Meeting wraps up and before your dinner reservation. Great midweek slot!"
    }
  ]
}
```

**What to Verify:**
- ✅ AI mentions your actual calendar events
- ✅ Provides reasoning about what's before/after
- ✅ Conversational and natural language
- ✅ Suggests times from your free slots

### Step 5: Test Real Venue Suggestions

```bash
curl -X POST https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/suggest-catchup \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "name": "John Doe",
        "context": "Met at startup event",
        "daysSinceMet": 15,
        "lastCatchup": "2 weeks ago"
      }
    ],
    "preferences": ["coffee shops", "bars"],
    "city": "Paris"
  }'
```

**Expected Output:**
```json
{
  "suggestions": [
    {
      "name": "John Doe",
      "suggestion": "Coffee to discuss the startup idea",
      "urgency": "medium",
      "timeframe": "This week",
      "placeName": "Café de Flore",
      "address": "172 Boulevard Saint-Germain",
      "searchQuery": "Café de Flore Paris",
      "placeType": "coffee",
      "placeDescription": "Historic literary café in Saint-Germain"
    }
  ]
}
```

**What to Verify:**
- ✅ Suggests REAL places (not "a coffee shop")
- ✅ Provides actual business names
- ✅ Includes Google Maps search query
- ✅ Address or neighborhood provided

### Step 6: Test Calendar Event Creation

```bash
# You need a catchup ID from your database first
curl -X POST https://ejhqzvmlurlvkypmmjyl.supabase.co/functions/v1/create-calendar-event \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "catchupId": "00000000-0000-0000-0000-000000000000",
    "contactName": "John Doe",
    "scheduledTime": "2026-01-22T15:00:00Z",
    "durationMinutes": 60,
    "placeName": "Café de Flore",
    "message": "Catch up about startup ideas"
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "eventId": "abc123xyz",
  "eventLink": "https://calendar.google.com/calendar/event?eid=..."
}
```

**What to Verify:**
- ✅ Event appears in your Google Calendar
- ✅ Correct time, duration, location
- ✅ Reminders set (60 min & 15 min before)

## Issues Found

### Issue #1: Context About Surrounding Events
**Status:** ⚠️ NEEDS ENHANCEMENT

The `suggest-slots` function provides context about what's in your calendar, but it doesn't explicitly tell you:
- "Before this slot, you have X"
- "After this slot, you have Y"

**Current Behavior:**
```json
{
  "reasoning": "Perfect timing after your Team Meeting wraps up..."
}
```

**Desired Behavior:**
```json
{
  "beforeEvent": "Team Meeting (10:00 AM - 11:00 AM)",
  "afterEvent": "Dinner (7:00 PM - 9:00 PM)", 
  "reasoning": "This slot gives you time to wrap up from Team Meeting and prepare for Dinner"
}
```

### Issue #2: Hour-by-Hour Calendar View
**Status:** ⚠️ NOT IMPLEMENTED

The Edge Functions analyze the calendar but don't return a day-by-day, hour-by-hour view.

**Suggestion:** Add a new endpoint `get-calendar-view` that returns:
```json
{
  "days": [
    {
      "date": "2026-01-21",
      "hours": [
        {"time": "09:00", "status": "free"},
        {"time": "10:00", "status": "busy", "event": "Team Meeting"},
        {"time": "11:00", "status": "free"}
      ]
    }
  ]
}
```

## Recommendations

1. **Enhance `suggest-slots`** to include explicit before/after event context
2. **Add calendar visualization** endpoint for hour-by-hour view
3. **Test with real calendar data** to verify AI reasoning quality
4. **Check Google Calendar permissions** in OAuth setup
