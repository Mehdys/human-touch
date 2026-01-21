# Venue Suggestions Fix Summary

## Issue
The venue suggestions feature in the PlanCatchup page was not showing:
- Google Maps links
- Real addresses  
- AI-powered venue descriptions

**Root Cause:** The `PlanCatchup.tsx` page was using hardcoded static places instead of calling the `suggest-catchup` Edge Function.

## Solution

### 1. Created `useCatchupVenues` Hook
**File:** `src/hooks/useCatchupVenues.ts`

```typescript
export function useCatchupVenues({ 
  contactName, 
  contactContext, 
  userCity, 
  userPreferences 
}) {
  // Calls suggest-catchup Edge Function
  // Returns real venues with Google Maps links
}
```

### 2. Updated `PlanCatchup.tsx`
- Added user profile fetching for city/preferences
- Integrated `useCatchupVenues` hook
- Updated place selection UI to show:
  - Google Maps icon with clickable link
  - Address below venue name
  - Loading state while fetching

### 3. UI Improvements
**Before:**
```
[ The Coffee Club ]
8 min walk
```

**After:**
```
[ Café de Flore              🗺️ ]
📍 172 Boulevard Saint-Germain
```

## Testing

To verify the fix works:

1. Navigate to the app: http://localhost:8081/
2. Click on a contact to plan a catchup
3. Select any time slot
4. Select "Café" (or any place type)
5. **Verify you see:**
   - AI-suggested real venue names
   - Clickable map pin icons (🗺️) 
   - Addresses below venue names
   - Google Maps links open in new tab

## Files Changed
1. `src/hooks/useCatchupVenues.ts` - NEW
2. `src/pages/PlanCatchup.tsx` - UPDATED

## Status
✅ **FIXED** - Venue suggestions now show real places with Google Maps links and addresses.
