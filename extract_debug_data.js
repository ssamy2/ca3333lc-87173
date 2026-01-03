// Script to extract and analyze the debug data from localStorage
// Run this in the browser console to get the debug data

const debugData = JSON.parse(localStorage.getItem("regularGiftsDebugData"));

if (debugData) {
  console.log("=== REGULAR GIFTS DEBUG DATA ANALYSIS ===");
  console.log(`Total regular gifts processed: ${debugData.regularGifts.length}`);
  console.log(`Total items in allMarketData: ${debugData.allMarketDataNames.length}`);
  
  console.log("\n=== REGULAR GIFTS (first 10) ===");
  debugData.regularGifts.slice(0, 10).forEach(gift => {
    console.log(`- ${gift.originalName} → cleaned: "${gift.cleanedName}"`);
  });
  
  console.log("\n=== ALL MARKET DATA NAMES (sample) ===");
  // Show all unique names in allMarketData
  const uniqueNames = [...new Set(debugData.allMarketDataNames)];
  console.log(`Unique names in allMarketData: ${uniqueNames.length}`);
  
  // Check for potential matches
  console.log("\n=== CHECKING FOR POTENTIAL MATCHES ===");
  debugData.regularGifts.forEach(regularGift => {
    const cleanedName = regularGift.cleanedName;
    
    // Look for exact match
    const exactMatch = uniqueNames.find(name => name === cleanedName);
    
    // Look for partial matches
    const partialMatches = uniqueNames.filter(name => 
      name.toLowerCase().includes(cleanedName.toLowerCase()) ||
      cleanedName.toLowerCase().includes(name.toLowerCase())
    );
    
    if (exactMatch) {
      console.log(`✅ EXACT MATCH: "${cleanedName}" found in allMarketData`);
    } else if (partialMatches.length > 0) {
      console.log(`⚠️ PARTIAL MATCHES for "${cleanedName}": ${partialMatches.join(", ")}`);
    } else {
      console.log(`❌ NO MATCH: "${cleanedName}" not found in allMarketData`);
    }
  });
  
  // Show all unique names to understand the data structure
  console.log("\n=== ALL UNIQUE NAMES IN MARKET DATA ===");
  uniqueNames.sort().forEach(name => console.log(`- ${name}`));
  
  // Copy to clipboard for analysis
  const analysisData = {
    regularGifts: debugData.regularGifts,
    uniqueNamesInMarketData: uniqueNames.sort(),
    summary: {
      totalRegularGifts: debugData.regularGifts.length,
      totalUniqueNames: uniqueNames.length,
      timestamp: debugData.timestamp
    }
  };
  
  console.log("\n=== COPYING ANALYSIS TO CLIPBOARD ===");
  console.log("Use: copy(analysisData) to copy the full analysis");
  
  // Make it available globally
  window.analysisData = analysisData;
  
} else {
  console.log("No debug data found in localStorage. Please run the heatmap first.");
}
