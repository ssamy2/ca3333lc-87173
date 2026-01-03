// Test script to verify Regular gifts percentage changes from API
import fs from 'fs';

// Read the API response
const apiData = JSON.parse(fs.readFileSync('src/res.json', 'utf8'));

console.log('=== All Gifts in API Response ===\n');

// Display all gifts
Object.entries(apiData).forEach(([key, gift]) => {
  console.log(`Key: "${key}"`);
  console.log(`Name: ${gift.name || 'N/A'}`);
  
  // Check if it's a Regular gift (key starts with [Regular])
  if (key.startsWith('[Regular]')) {
    console.log('✅ This is a Regular Gift!');
    console.log(`   TON Price: ${gift.priceTon}`);
    console.log(`   USD Price: ${gift.priceUsd}`);
    console.log(`   24h Change (TON): ${gift['change_24h_ton_%'] !== null && gift['change_24h_ton_%'] !== undefined ? gift['change_24h_ton_%'] + '%' : 'N/A'}`);
    console.log(`   24h Change (USD): ${gift['change_24h_usd_%'] !== null && gift['change_24h_usd_%'] !== undefined ? gift['change_24h_usd_%'] + '%' : 'N/A'}`);
  }
  console.log('---');
});

console.log('\n=== Regular Gifts Summary ===\n');

// Filter Regular gifts by key
const regularGifts = Object.entries(apiData)
  .filter(([key, gift]) => key.startsWith('[Regular]'))
  .map(([key, gift]) => ({ key, ...gift }));

regularGifts.forEach(gift => {
  const cleanName = gift.key.replace('[Regular] ', '');
  console.log(`📦 ${cleanName}:`);
  console.log(`   TON Price: ${gift.priceTon}`);
  console.log(`   USD Price: ${gift.priceUsd}`);
  console.log(`   24h Change (TON): ${gift['change_24h_ton_%'] !== null && gift['change_24h_ton_%'] !== undefined ? gift['change_24h_ton_%'] + '%' : 'N/A'}`);
  console.log(`   24h Change (USD): ${gift['change_24h_usd_%'] !== null && gift['change_24h_usd_%'] !== undefined ? gift['change_24h_usd_%'] + '%' : 'N/A'}`);
  console.log('');
});

// Count statistics
const regularWithChanges = regularGifts.filter(g => 
  g['change_24h_ton_%'] !== null && g['change_24h_ton_%'] !== undefined
);

console.log('=== Statistics ===');
console.log(`Total Regular Gifts: ${regularGifts.length}`);
console.log(`Regular Gifts with 24h changes: ${regularWithChanges.length}`);
console.log(`Regular Gifts without 24h changes: ${regularGifts.length - regularWithChanges.length}`);
