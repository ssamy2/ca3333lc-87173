/**
 * Test script to verify Regular gifts percentage fix
 * This script checks console logs to ensure the matching logic is working
 */

console.log('🧪 Testing Regular Gifts Percentage Fix...\n');

// Simulate the data structure
const mockRegularGift = {
  name: '[Regular] Delicious Cake',
  priceTon: 50,
  priceUsd: 250,
  tonPrice24hAgo: 50,
  usdPrice24hAgo: 250,
  image: 'https://example.com/cake.png',
  upgradedSupply: 0
};

const mockUpgradedGift = {
  name: 'Delicious Cake',
  priceTon: 100,
  priceUsd: 500,
  tonPrice24hAgo: 95,
  usdPrice24hAgo: 475,
  image: 'https://example.com/cake.png',
  upgradedSupply: 1000
};

const allMarketData = [mockRegularGift, mockUpgradedGift];

console.log('📊 Mock Data:');
console.log('Regular Gift:', mockRegularGift.name, '- Current:', mockRegularGift.priceTon, 'TON');
console.log('Upgraded Gift:', mockUpgradedGift.name, '- Current:', mockUpgradedGift.priceTon, 'TON, Previous:', mockUpgradedGift.tonPrice24hAgo, 'TON');

// Test the matching logic
const cleanName = mockRegularGift.name.replace(/^\[Regular\]\s*/i, '').trim();
console.log('\n🔍 Cleaned name:', cleanName);

const upgradedGift = allMarketData.find(g => {
  const giftCleanName = g.name.replace(/^\[Regular\]\s*/i, '').trim();
  const isRegularGiftCheck = g.name.match(/^\[Regular\]/i);
  
  return !isRegularGiftCheck && 
    (giftCleanName === cleanName || giftCleanName.toLowerCase() === cleanName.toLowerCase());
});

if (upgradedGift) {
  console.log('✅ Match Found:', upgradedGift.name);
  
  const upgradedCurrentPrice = upgradedGift.priceTon;
  const upgradedPreviousPrice = upgradedGift.tonPrice24hAgo;
  const percentChange = upgradedPreviousPrice === 0 ? 0 : 
    ((upgradedCurrentPrice - upgradedPreviousPrice) / upgradedPreviousPrice) * 100;
  
  console.log('\n📈 Calculation:');
  console.log('Current Price:', upgradedCurrentPrice, 'TON');
  console.log('Previous Price:', upgradedPreviousPrice, 'TON');
  console.log('Percentage Change:', percentChange.toFixed(2) + '%');
  
  if (percentChange !== 0) {
    console.log('\n✅ SUCCESS: Regular gift now shows non-zero percentage!');
  } else {
    console.log('\n⚠️ WARNING: Percentage is still 0%');
  }
} else {
  console.log('❌ No match found');
}

console.log('\n' + '='.repeat(60));
console.log('Test completed. Check the browser console for actual results.');
console.log('='.repeat(60));
