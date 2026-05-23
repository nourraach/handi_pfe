// Simple test to check if job offer APIs are working
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testJobOfferAPIs() {
  try {
    console.log('Testing job offer APIs...');
    
    // Test health endpoint first
    const healthResponse = await axios.get(`${BASE_URL}/api/sante`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test public job offers endpoint
    const offersResponse = await axios.get(`${BASE_URL}/api/offres-emploi`);
    console.log('✅ Public job offers:', offersResponse.data);
    
    console.log('Job offer APIs are working!');
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testJobOfferAPIs();