# Regular Gifts Debug Logging Implementation

## Date: 2024

## Summary
Successfully implemented comprehensive debug logging for regular gifts in the heatmap to track and diagnose percentage calculation issues.

## Implementation Details

### 1. Component Updates
- **File:** `src/components/TreemapHeatmap.tsx`
- Added `allData` prop to access full market data
- Updated `transformGiftData` function signature to accept `allMarketData` parameter

### 2. Debug Logging Features

#### Console Logging
- Logs every regular gift processing step
- Tracks name transformation: `[Regular] Gift Name` → `Gift Name`
- Shows search process for matching upgraded gifts
- Lists available upgraded gifts when no match found
- Records calculation method used (upgraded gift data vs own history)

#### Data Collection
The debug system collects:
```javascript
{
  originalName: string,
  displayName: string,
  cleanName: string,
  priceTon: number,
  priceUsd: number,
  tonPrice24hAgo: number,
  usdPrice24hAgo: number,
  tonPriceWeekAgo: number,
  usdPriceWeekAgo: number,
  tonPriceMonthAgo: number,
  usdPriceMonthAgo: number,
  currency: 'ton' | 'usd',
  timeGap: '24h' | '1w' | '1m',
  isRegularMode: boolean,
  isAllMode: boolean,
  upgradedGiftFound: boolean,
  upgradedGiftName: string | null,
  upgradedGiftData: object | null,
  availableUpgradedGifts: array,
  calculationMethod: 'upgraded_gift' | 'own_history',
  percentChange: number,
  finalSize: number,
  finalResult: object,
  timestamp: string
}
```

### 3. LocalStorage Integration
- Automatically saves debug data to localStorage
- Key: `regularGiftsDebugData`
- Format: Formatted JSON with 2-space indentation

### 4. Name Matching Algorithm
```javascript
// Regex-based normalization
const cleanName = item.name.replace(/^\[Regular\]\s*/i, '').trim();

// Search in full market data
const upgradedGift = allMarketData?.find(g => {
  const giftCleanName = g.name.replace(/^\[Regular\]\s*/i, '').trim();
  const isRegularGift = g.name.match(/^\[Regular\]/i);
  
  // Match if: not a regular gift AND names match (case-insensitive)
  const isMatch = !isRegularGift && 
    (giftCleanName === cleanName || giftCleanName.toLowerCase() === cleanName.toLowerCase());
  
  return isMatch;
});
```

## Usage Instructions

### 1. View Console Logs
1. Open the application
2. Navigate to Heatmap page
3. Select "Regular" mode
4. Open browser console (F12)
5. Observe detailed logs for each regular gift

### 2. Extract Debug Data
Run in browser console:
```javascript
// Copy to clipboard
copy(JSON.parse(localStorage.getItem("regularGiftsDebugData")))

// View in console
console.log(JSON.parse(localStorage.getItem("regularGiftsDebugData")))
```

### 3. Debug Output Example
```javascript
{
  "timestamp": "2024-XX-XX",
  "chartType": "change",
  "timeGap": "24h",
  "currency": "ton",
  "isRegularMode": true,
  "isAllMode": false,
  "regularGiftsCount": 25,
  "regularGifts": [
    {
      "originalName": "[Regular] Gift Name",
      "cleanName": "Gift Name",
      "upgradedGiftFound": true,
      "upgradedGiftName": "Gift Name",
      "calculationMethod": "upgraded_gift",
      "percentChange": 5.23,
      // ... more fields
    }
  ]
}
```

## Key Console Log Messages

### Success Cases
- `✅ [MATCH FOUND] Upgraded gift found: "Gift Name" for regular gift: "[Regular] Gift Name"`
- `✅ [CALCULATION] Gift Name: percentChange: 5.23%`
- `💾 [DEBUG] Regular gifts debug data saved to localStorage`

### Warning Cases
- `⚠️ [NO MATCH] No upgraded gift found for: "Gift Name"`
- `📊 [FALLBACK] Gift Name: Using own history`

## Problem Solved
This debug logging system helps identify:
1. Why regular gifts show 0% change
2. Which regular gifts fail to match with upgraded versions
3. What calculation method is being used
4. The exact price data being used for calculations

## Files Modified
1. `src/components/TreemapHeatmap.tsx` - Added debug logging
2. `src/pages/HeatmapPage.tsx` - Passed allData prop

## Testing Recommendations
1. Test with different time periods (24h, 1w, 1m)
2. Test with different currencies (TON, USD)
3. Verify regular gifts match correctly with upgraded versions
4. Check edge cases where no upgraded version exists
