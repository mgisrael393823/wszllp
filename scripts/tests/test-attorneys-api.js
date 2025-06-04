import fetch from 'node-fetch';

async function testAttorneysAPI() {
  console.log('Testing Tyler Attorneys API...\n');

  try {
    // Test the local API endpoint
    console.log('1. Testing local API endpoint...');
    const response = await fetch('http://localhost:5173/api/tyler/attorneys');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received\n');
    
    console.log('2. Attorneys found:', data.count);
    console.log('\n3. Attorney details:');
    
    data.attorneys?.forEach((attorney, index) => {
      console.log(`\n   Attorney ${index + 1}:`);
      console.log(`   - ID: ${attorney.id}`);
      console.log(`   - Display Name: ${attorney.displayName}`);
      console.log(`   - Bar Number: ${attorney.barNumber}`);
      console.log(`   - Name: ${attorney.firstName} ${attorney.middleName || ''} ${attorney.lastName}`.trim());
      console.log(`   - Firm ID: ${attorney.firmId}`);
    });

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAttorneysAPI();