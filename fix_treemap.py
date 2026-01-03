import re

# Read the original file
with open('src/components/TreemapHeatmap.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import for useMarketData
if "import { useMarketData }" not in content:
    content = content.replace(
        "import tonIconSrc from '@/assets/ton-icon.png';",
        "import { useMarketData } from '@/hooks/useMarketData';\nimport tonIconSrc from '@/assets/ton-icon.png';"
    )

# Update the transformGiftData function signature
content = re.sub(
    r'const transformGiftData = \(\s*data: GiftItem\[\],\s*chartType:',
    'const transformGiftData = (\n  data: GiftItem[],\n  allMarketData: any,\n  chartType:',
    content
)

# Update the component to use useMarketData hook
if "const { data: fullMarketData } = useMarketData();" not in content:
    # Find the location after other hooks
    pattern = r'(const { toast } = useToast\(\);)'
    replacement = r'\1\n  \n  // Get full market data for finding corresponding upgraded gifts\n  const { data: fullMarketData } = useMarketData();'
    content = re.sub(pattern, replacement, content)

# Update the transformGiftData call to include fullMarketData
content = re.sub(
    r'const transformed = transformGiftData\(filteredData, chartType, timeGap, currency, isRegularMode, isAllMode\)',
    'const transformed = transformGiftData(filteredData, fullMarketData || {}, chartType, timeGap, currency, isRegularMode, isAllMode)',
    content
)

# Update the downloadImage function's transformGiftData call
content = re.sub(
    r'const transformedData = transformGiftData\(data, chartType, timeGap, currency, isRegularMode, isAllMode\)',
    'const transformedData = transformGiftData(data, fullMarketData || {}, chartType, timeGap, currency, isRegularMode, isAllMode)',
    content
)

# Fix the regular gift percentage calculation logic
old_logic = """      // Find the corresponding upgraded gift to get its percentage change
      const upgradedGift = data.find(g => 
        !g.name.startsWith('[Regular]') && 
        (g.name === cleanName || g.name.toLowerCase() === cleanName.toLowerCase())
      );"""

new_logic = """      // Find the corresponding upgraded gift in the full market data
      let upgradedGift = null;
      if (allMarketData && allMarketData[cleanName]) {
        upgradedGift = {
          name: cleanName,
          priceTon: allMarketData[cleanName].priceTon || allMarketData[cleanName].price_ton,
          priceUsd: allMarketData[cleanName].priceUsd || allMarketData[cleanName].price_usd,
          tonPrice24hAgo: allMarketData[cleanName].tonPrice24hAgo,
          usdPrice24hAgo: allMarketData[cleanName].usdPrice24hAgo,
          tonPriceWeekAgo: allMarketData[cleanName].tonPriceWeekAgo,
          usdPriceWeekAgo: allMarketData[cleanName].usdPriceWeekAgo,
          tonPriceMonthAgo: allMarketData[cleanName].tonPriceMonthAgo,
          usdPriceMonthAgo: allMarketData[cleanName].usdPriceMonthAgo
        };
      }"""

content = content.replace(old_logic, new_logic)

# Add fullMarketData to the useEffect dependencies
content = re.sub(
    r'\}, \[data, chartType, timeGap, currency, isRegularMode, isAllMode\]\);',
    '}, [data, fullMarketData, chartType, timeGap, currency, isRegularMode, isAllMode]);',
    content
)

# Add fullMarketData to downloadImage dependencies
content = re.sub(
    r'\}, \[data, chartType, timeGap, currency, language, handleHapticFeedback, isDownloading\]\);',
    '}, [data, fullMarketData, chartType, timeGap, currency, language, handleHapticFeedback, isDownloading]);',
    content
)

# Write the modified content back
with open('src/components/TreemapHeatmap.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ TreemapHeatmap.tsx has been successfully updated!")
