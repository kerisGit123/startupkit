I'll analyze the issues and fix them step by step.

## Issues Identified:

1. **Replace All strategy** - Should delete all existing storyboard items and elements before rebuilding
2. **Smart environment detection** - Not functioning correctly (showing 9 generic environment elements instead of smart-detected ones)
3. **Element strategy logic** - Needs proper handling for "Preserve Elements" vs "Regenerate Elements"

Let me start by examining the current build logic:



Let me check the buildStoryboard mutation to understand how it handles the hard_rebuild strategy:



Looking at the code, I can see the issues:

1. **Replace All (hard_rebuild) is working correctly** - It deletes all items and elements (lines 227-253)
2. **The problem is with smart environment detection** - The enhanced extraction API is being called, but the elements aren't being used properly

Let me check the enhanced extraction API to see how smart environment detection works:

Looking at the code and logs, I can identify the issues:

1. **Smart environment detection IS working** - The API extracts smart environments like "The Deep Ocean", "Research Control Room", etc.
2. **The problem**: When `elementStrategy` is "preserve", the frontend sets `finalElements = []`, which means NO elements are passed to the backend, causing it to fall back to creating generic environment elements from scene locations.

Let me trace through the logic and fix it:

Now I need to update the backend to handle the `undefined` case for `enhancedElements` to skip element creation entirely:

Now let me fix the normal build to properly handle element strategy:

# Summary of Fixes

I've fixed the **Replace All** rebuild strategy and **smart environment detection** issues. Here's what was corrected:

## Issues Fixed:

### 1. **Element Strategy Logic** ✅
**Problem**: When using "Preserve Elements", the system was passing an empty array `[]` to the backend, which triggered fallback element creation from scene locations, creating 9 generic environment elements instead of using smart-detected ones.

**Fix**:
- **Preserve Elements**: Now passes `undefined` to skip ALL element creation
- **Regenerate Elements**: Passes enhanced elements from AI extraction (smart environments like "The Deep Ocean", "Research Control Room", etc.)

### 2. **Enhanced Build + Regenerate** ✅
**Problem**: Enhanced elements from smart environment detection weren't being used.

**Fix**: When `buildType: "enhanced"` and `elementStrategy: "regenerate"`, the system now:
- Calls the enhanced extraction API
- Extracts smart environments using pattern matching (deep ocean, research facility, aquarium, etc.)
- Passes these enhanced elements to the backend
- Creates elements with `createdBy: "system-enhanced"` and detailed descriptions

### 3. **Normal Build + Element Strategy** ✅
**Problem**: Normal build didn't respect element strategy properly.

**Fix**:
- **Normal Build + Preserve**: Passes `undefined` to skip element creation
- **Normal Build + Regenerate**: Passes `[]` to allow fallback element creation from scene locations

### 4. **Hard Rebuild (Replace All)** ✅
**Already Working**: The backend correctly deletes all existing storyboard items and elements before rebuilding.

## How It Works Now:

| Build Type | Element Strategy | Result |
|------------|------------------|--------|
| **Enhanced** | Regenerate | Smart AI-detected environments (e.g., "The Deep Ocean", "Research Control Room") |
| **Enhanced** | Preserve | No new elements created, keeps existing ones |
| **Normal** | Regenerate | Fallback elements from scene locations |
| **Normal** | Preserve | No new elements created, keeps existing ones |

## Testing Recommendation:

Try: **Replace All + Enhanced Build + Regenerate Elements**

This should:
1. Delete all existing items and elements
2. Extract smart environments using AI pattern matching
3. Create properly named, consolidated environments instead of 9 generic ones
4. Show elements like "The Deep Ocean", "Giant Aquarium Facility", "Research Control Room" in the Element Library

The lint errors shown are pre-existing and unrelated to these changes.