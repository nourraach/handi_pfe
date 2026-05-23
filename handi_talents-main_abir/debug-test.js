const fetch = require('node-fetch');

async function testAPI() {
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@handitalents.com',
        mdp: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    const token = loginData.donnees.token;
    console.log('Token obtained:', token ? 'Yes' : 'No');
    
    // 2. Create a simple test
    console.log('\n2. Creating test...');
    const testData = {
      titre: "Test Simple",
      description: "Test de base",
      type_test: "soft_skills",
      duree_minutes: 30,
      date_debut_validite: new Date().toISOString(),
      date_fin_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      instructions: "Instructions de test",
      questions: [
        {
          contenu_question: "Question test ?",
          type_question: "choix_multiple",
          score_question: 10,
          ordre: 1,
          obligatoire: true,
          options: [
            {
              texte_option: "Option 1",
              est_correcte: true,
              score_option: 10,
              ordre: 1
            },
            {
              texte_option: "Option 2",
              est_correcte: false,
              score_option: 0,
              ordre: 2
            }
          ]
        }
      ]
    };
    
    const createResponse = await fetch('http://localhost:4000/api/tests-psychologiques/admin/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    const createData = await createResponse.text();
    console.log('Create response status:', createResponse.status);
    console.log('Create response:', createData);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();