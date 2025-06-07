import fetch from 'node-fetch';

async function testAttorneysAPI() {
  console.log('Testing Tyler Attorneys API locally...\n');

  try {
    // Test the local API endpoint
    console.log('1. Testing local API endpoint on port 5178...');
    const response = await fetch('http://localhost:5178/api/tyler/attorneys');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    // Since local dev returns the JS file, let's test the actual Tyler API directly
    console.log('\n2. Testing Tyler API directly...');
    
    // First authenticate
    const authResponse = await fetch('https://api.uslegalpro.com/v4/il/user/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'clienttoken': 'EVICT87'
      },
      body: JSON.stringify({
        data: {
          username: process.env.TYLER_API_USERNAME || 'czivin@wolfsolovy.com',
          password: process.env.TYLER_API_PASSWORD || 'Zuj90820*'
        }
      })
    });

    console.log('Auth response status:', authResponse.status);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Authentication failed: ${authResponse.status} - ${errorText}`);
    }

    const authData = await authResponse.json();
    console.log('Auth response:', authData);
    
    const authToken = authData.item?.auth_token;
    if (!authToken) {
      throw new Error('No auth token received');
    }

    console.log('Auth token received:', authToken.substring(0, 20) + '...');

    // Now fetch attorneys
    console.log('\n3. Fetching attorneys...');
    const attorneysResponse = await fetch('https://api.uslegalpro.com/v4/il/firm/attorneys', {
      method: 'GET',
      headers: {
        'authtoken': authToken
      }
    });

    console.log('Attorneys response status:', attorneysResponse.status);

    if (!attorneysResponse.ok) {
      const errorText = await attorneysResponse.text();
      throw new Error(`Failed to fetch attorneys: ${attorneysResponse.status} - ${errorText}`);
    }

    const attorneysData = await attorneysResponse.json();
    console.log('\n4. Attorneys response:', attorneysData);
    
    if (attorneysData.items) {
      console.log('\n5. Attorneys found:', attorneysData.count);
      attorneysData.items.forEach((attorney, index) => {
        console.log(`\n   Attorney ${index + 1}:`);
        console.log(`   - ID: ${attorney.id}`);
        console.log(`   - Display Name: ${attorney.display_name}`);
        console.log(`   - Bar Number: ${attorney.bar_number}`);
        console.log(`   - Name: ${attorney.first_name} ${attorney.middle_name || ''} ${attorney.last_name}`.trim());
        console.log(`   - Firm ID: ${attorney.firm_id}`);
      });
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAttorneysAPI();