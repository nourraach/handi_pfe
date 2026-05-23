const jwt = require('jsonwebtoken');

// Use the same JWT secret from your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Create a test token for an enterprise user
const testPayload = {
  id_utilisateur: "27e1835a-8dd3-4313-9377-d36ce1ac901b", // Existing enterprise ID from your code
  email: "test@entreprise.com",
  role: "entreprise"
};

const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: "1d" });

console.log('🔑 Test Token Generated:');
console.log(token);
console.log('\n📋 Use this in your frontend Authorization header:');
console.log(`Authorization: Bearer ${token}`);