// Analyze the gift matching issue
import fs from 'fs';

// Read the market data
const marketData = JSON.parse(fs.readFileSync('market_data_sample.json', 'utf8'));

// Get all gift names
const allGiftNames = Object.keys(marketData);

// Separate regular and upgraded gifts
const regularGifts = allGiftNames.filter(name => name.startsWith('[Regular]'));
const upgradedGifts = allGiftNames.filter(name => !name.startsWith('[Regular]'));

console.log('=== GIFT ANALYSIS ===');
console.log(`Total gifts: ${allGiftNames.length}`);
console.log(`Regular gifts: ${regularGifts.length}`);
console.log(`Upgraded gifts: ${upgradedGifts.length}`);

console.log('\n=== REGULAR GIFTS ===');
regularGifts.forEach(regular => {
  const cleanName = regular.replace(/^\[Regular\]\s*/i, '').trim();
  console.log(`- ${regular} → "${cleanName}"`);
});

console.log('\n=== UPGRADED GIFTS (first 20) ===');
upgradedGifts.slice(0, 20).forEach(name => {
  console.log(`- ${name}`);
});

console.log('\n=== CHECKING FOR MATCHES ===');
regularGifts.forEach(regular => {
  const cleanName = regular.replace(/^\[Regular\]\s*/i, '').trim();
  
  // Look for exact match in upgraded gifts
  const exactMatch = upgradedGifts.find(upgraded => upgraded === cleanName);
  
  // Look for similar names (case-insensitive, partial match)
  const similarMatches = upgradedGifts.filter(upgraded => {
    const upgradedLower = upgraded.toLowerCase();
    const cleanLower = cleanName.toLowerCase();
    return upgradedLower.includes(cleanLower) || cleanLower.includes(upgradedLower);
  });
  
  if (exactMatch) {
    console.log(`✅ MATCH: "${cleanName}" → "${exactMatch}"`);
  } else if (similarMatches.length > 0) {
    console.log(`⚠️ SIMILAR: "${cleanName}" → [${similarMatches.join(', ')}]`);
  } else {
    console.log(`❌ NO MATCH: "${cleanName}"`);
  }
});

// Check if there are any patterns
console.log('\n=== PATTERN ANALYSIS ===');
console.log('Regular gifts that might have upgraded versions:');

// Check for gifts that exist in both regular and upgraded forms
const potentialMatches = [];
regularGifts.forEach(regular => {
  const cleanName = regular.replace(/^\[Regular\]\s*/i, '').trim();
  
  // Check various name patterns
  const patterns = [
    cleanName, // Exact name
    cleanName.replace(/'/g, "'"), // Replace smart quotes
    cleanName.replace(/['']/g, "'"), // Replace all quote types
    cleanName.replace(/\s+/g, ' '), // Normalize spaces
  ];
  
  patterns.forEach(pattern => {
    const match = upgradedGifts.find(upgraded => 
      upgraded.toLowerCase() === pattern.toLowerCase()
    );
    if (match && !potentialMatches.find(m => m.regular === regular)) {
      potentialMatches.push({ regular, cleanName, upgraded: match });
    }
  });
});

if (potentialMatches.length > 0) {
  console.log('\nFound potential matches:');
  potentialMatches.forEach(({ regular, cleanName, upgraded }) => {
    console.log(`  "${regular}" → "${upgraded}"`);
  });
} else {
  console.log('\nNo direct matches found between regular and upgraded gifts.');
  console.log('This suggests regular gifts might not have corresponding upgraded versions in the dataset.');
}

// Save analysis to file
const analysis = {
  summary: {
    totalGifts: allGiftNames.length,
    regularGifts: regularGifts.length,
    upgradedGifts: upgradedGifts.length,
    matchesFound: potentialMatches.length
  },
  regularGifts: regularGifts.map(name => ({
    original: name,
    cleaned: name.replace(/^\[Regular\]\s*/i, '').trim()
  })),
  upgradedGifts: upgradedGifts,
  potentialMatches
};

fs.writeFileSync('gift_analysis.json', JSON.stringify(analysis, null, 2));
console.log('\n✅ Analysis saved to gift_analysis.json');
