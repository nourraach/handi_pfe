const API_BASE_URL = 'http://localhost:4000';

// Données de test pour créer des demandes en attente
const demandesTest = [
  {
    nom: 'Jean Dupont',
    email: 'jean.dupont@test.com',
    mot_de_passe: 'JeanTest123!',
    role: 'candidat',
    statut: 'en_attente',
    telephone: '0123456789',
    addresse: '123 Rue de Test, 75001 Paris',
    profil_candidat: {
      competences: ['JavaScript', 'React', 'Node.js'],
      experience: '2 ans',
      formation: 'Master Informatique',
      handicap: 'Aucun'
    }
  },
  {
    nom: 'Marie Martin',
    email: 'marie.martin@test.com',
    mot_de_passe: 'MarieTest123!',
    role: 'candidat',
    statut: 'en_attente',
    telephone: '0987654321',
    addresse: '456 Avenue Test, 69000 Lyon',
    profil_candidat: {
      competences: ['Python', 'Django', 'PostgreSQL'],
      experience: '3 ans',
      formation: 'Licence Informatique',
      handicap: 'Mobilité réduite'
    }
  },
  {
    nom: 'TechCorp SARL',
    email: 'contact@techcorp.test.com',
    mot_de_passe: 'TechCorp123!',
    role: 'entreprise',
    statut: 'en_attente',
    telephone: '0145678901',
    addresse: '789 Boulevard Innovation, 92000 Nanterre',
    profil_entreprise: {
      secteur: 'Technologie',
      taille: '50-100 employés',
      description: 'Entreprise spécialisée en développement web et mobile'
    }
  },
  {
    nom: 'InnovateLab',
    email: 'rh@innovatelab.test.com',
    mot_de_passe: 'InnovateLab123!',
    role: 'entreprise',
    statut: 'en_attente',
    telephone: '0156789012',
    addresse: '321 Rue Startup, 75011 Paris',
    profil_entreprise: {
      secteur: 'Intelligence Artificielle',
      taille: '10-50 employés',
      description: 'Startup spécialisée en IA et machine learning'
    }
  }
];

async function creerDemandesTest() {
  try {
    console.log('🚀 Création des demandes en attente pour test...\n');

    for (let i = 0; i < demandesTest.length; i++) {
      const demande = demandesTest[i];
      console.log(`📝 Création de la demande ${i + 1}/${demandesTest.length}: ${demande.nom} (${demande.role})`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/inscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(demande)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Demande créée avec succès`);
          console.log(`   Email: ${demande.email}`);
          console.log(`   Statut: ${demande.statut}`);
          console.log(`   ID: ${result.id_utilisateur || 'N/A'}`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Erreur lors de la création de ${demande.nom}:`, errorText);
        }
      } catch (error) {
        console.log(`💥 Erreur de connexion pour ${demande.nom}:`, error.message);
      }
      
      console.log(''); // Ligne vide pour la lisibilité
    }

    console.log('🎉 Création des demandes terminée !');
    console.log('\n📋 Récapitulatif des demandes créées :');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│                      DEMANDES EN ATTENTE                       │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    
    demandesTest.forEach((demande, index) => {
      console.log(`│ ${(index + 1).toString().padStart(2)}. ${demande.nom.padEnd(25)} │ ${demande.role.padEnd(10)} │ ${demande.email.padEnd(20)} │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────┘');
    console.log('\n💡 Ces demandes devraient maintenant apparaître dans l\'interface admin !');
    console.log('🔄 Actualisez la page admin pour voir les nouvelles demandes.');

  } catch (error) {
    console.error('❌ Erreur générale lors de la création des demandes:', error.message);
  }
}

// Fonction pour vérifier les demandes existantes
async function verifierDemandesExistantes() {
  try {
    console.log('🔍 Vérification des demandes existantes...\n');
    
    // Utiliser un token admin pour tester
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91dGlsaXNhdGV1ciI6ImFkbWluXzEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3NTU5MzI4LCJleHAiOjE3Mzc1NjI5Mjh9.example';
    
    const response = await fetch(`${API_BASE_URL}/api/admin/demandes-en-attente`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📊 Réponse de l\'API:', JSON.stringify(data, null, 2));
      
      if (data.donnees && data.donnees.demandes) {
        console.log(`📋 Nombre de demandes trouvées: ${data.donnees.demandes.length}`);
        
        if (data.donnees.demandes.length > 0) {
          console.log('\n📝 Détails des demandes:');
          data.donnees.demandes.forEach((demande, index) => {
            console.log(`${index + 1}. ${demande.nom} (${demande.email}) - ${demande.role} - ${demande.statut}`);
          });
        } else {
          console.log('⚠️ Aucune demande en attente trouvée dans la base de données');
        }
      }
    } else {
      console.log('❌ Erreur API:', response.status, await response.text());
    }
  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error.message);
  }
}

// Exécution selon l'argument
if (process.argv[2] === '--verifier') {
  verifierDemandesExistantes();
} else {
  creerDemandesTest();
}