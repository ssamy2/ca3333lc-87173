import re

# Read the original file
with open('src/components/TreemapHeatmap.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the import for useMarketData (only if not already present)
if "useMarketData" not in content:
    content = content.replace(
        "import tonIconSrc from '@/assets/ton-icon.png';",
        "import tonIconSrc from '@/assets/ton-icon.png';\nimport { useMarketData } from '@/hooks/useMarketData';"
    )
    print("✅ Added useMarketData import")

# 2. Update the transformGiftData function to accept allMarketData parameter
old_signature = """const transformGiftData = (
  data: GiftItem[], 
  chartType: 'change' | 'marketcap', 
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd',
  isRegularMode: boolean = false,
  isAllMode: boolean = false
): TreemapDataPoint[]"""

new_signature = """const transformGiftData = (
  data: GiftItem[], 
  allMarketData: any, // Full market data for finding corresponding upgraded gifts
  chartType: 'change' | 'marketcap', 
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd',
  isRegularMode: boolean = false,
  isAllMode: boolean = false
): TreemapDataPoint[]"""

content = content.replace(old_signature, new_signature)
print("✅ Updated transformGiftData signature")

# 3. Fix the regular gift percentage calculation logic
old_logic = """      // Find the corresponding upgraded gift to get its percentage change
      const upgradedGift = data.find(g => 
        !g.name.startsWith('[Regular]') && 
        (g.name === cleanName || g.name.toLowerCase() === cleanName.toLowerCase())
      );"""

new_logic = """      // Find the corresponding upgraded gift in the full market data
      let upgradedGift = null;
      
      // First try to find in the full market data
      if (allMarketData && allMarketData[cleanName]) {
        const marketGift = allMarketData[cleanName];
        upgradedGift = {
          name: cleanName,
          priceTon: marketGift.priceTon || marketGift.price_ton,
          priceUsd: marketGift.priceUsd || marketGift.price_usd,
          tonPrice24hAgo: marketGift.tonPrice24hAgo,
          usdPrice24hAgo: marketGift.usdPrice24hAgo,
          tonPriceWeekAgo: marketGift.tonPriceWeekAgo,
          usdPriceWeekAgo: marketGift.usdPriceWeekAgo,
          tonPriceMonthAgo: marketGift.tonPriceMonthAgo,
          usdPriceMonthAgo: marketGift.usdPriceMonthAgo
        };
      } else {
        // Fallback to searching in the provided data array
        upgradedGift = data.find(g => 
          !g.name.startsWith('[Regular]') && 
          (g.name === cleanName || g.name.toLowerCase() === cleanName.toLowerCase())
        );
      }"""

content = content.replace(old_logic, new_logic)
print("✅ Fixed regular gift percentage calculation")

# 4. Add useMarketData hook in the component
if "const { data: fullMarketData } = useMarketData();" not in content:
    # Find the location after other hooks
    pattern = r'(const { toast } = useToast\(\);)'
    replacement = r'\1\n  \n  // Get full market data for finding corresponding upgraded gifts\n  const { data: fullMarketData } = useMarketData();'
    content = re.sub(pattern, replacement, content)
    print("✅ Added useMarketData hook")

# 5. Update all transformGiftData calls to include fullMarketData
# In useEffect
content = re.sub(
    r'const transformed = transformGiftData\(filteredData, chartType, timeGap, currency, isRegularMode, isAllMode\)',
    'const transformed = transformGiftData(filteredData, fullMarketData || {}, chartType, timeGap, currency, isRegularMode, isAllMode)',
    content
)

# In downloadImage function
content = re.sub(
    r'const transformedData = transformGiftData\(data, chartType, timeGap, currency, isRegularMode, isAllMode\)',
    'const transformedData = transformGiftData(data, fullMarketData || {}, chartType, timeGap, currency, isRegularMode, isAllMode)',
    content
)
print("✅ Updated transformGiftData calls")

# 6. Add fullMarketData to useEffect dependencies
content = re.sub(
    r'\}, \[data, chartType, timeGap, currency, isRegularMode, isAllMode\]\);',
    '}, [data, fullMarketData, chartType, timeGap, currency, isRegularMode, isAllMode]);',
    content
)

# 7. Add fullMarketData to downloadImage dependencies
content = re.sub(
    r'\}, \[data, chartType, timeGap, currency, language, handleHapticFeedback, isDownloading, isRegularMode, isAllMode\]\);',
    '}, [data, fullMarketData, chartType, timeGap, currency, language, handleHapticFeedback, isDownloading, isRegularMode, isAllMode]);',
    content
)
print("✅ Updated dependencies")

# Write the modified content back
with open('src/components/TreemapHeatmap.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ TreemapHeatmap.tsx has been successfully updated!")
print("The component now uses full market data to find corresponding upgraded gifts for percentage calculations.")
