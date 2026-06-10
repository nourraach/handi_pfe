const API_BASE_URL = 'http://localhost:4000';

// Données de test à injecter
const testData = {
  admin: {
    nom: 'Admin Test',
    email: 'admin@test.com',
    mot_de_passe: 'AdminTest123!',
    role: 'admin',
    statut: 'actif',
    telephone: '0123456789',
    addresse: '123 Rue de l\'Admin, 75001 Paris'
  },
  candidat: {
    nom: 'Candidat Vérifié',
    email: 'candidat@test.com',
    mot_de_passe: 'CandidatTest123!',
    role: 'candidat',
    statut: 'actif', // Déjà vérifié par l'admin
    telephone: '0987654321',
    addresse: '456 Avenue du Candidat, 69000 Lyon',
    profil_candidat: {
      competences: ['JavaScript', 'React', 'Node.js'],
      experience: '3 ans',
      formation: 'Master Informatique',
      handicap: 'Mobilité réduite'
    }
  }
};

async function injecterDonnees() {
  try {
    console.log('🚀 Injection des données de test...\n');

    // Injection du compte admin
    console.log('📝 Création du compte admin...');
    const adminResponse = await fetch(`${API_BASE_URL}/auth/inscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData.admin)
    });

    if (adminResponse.ok) {
      console.log('✅ Compte admin créé avec succès');
      console.log(`   Email: ${testData.admin.email}`);
      console.log(`   Mot de passe: ${testData.admin.mot_de_passe}`);
    } else {
      console.log('❌ Erreur lors de la création du compte admin:', await adminResponse.text());
    }

    // Injection du compte candidat
    console.log('\n📝 Création du compte candidat...');
    const candidatResponse = await fetch(`${API_BASE_URL}/auth/inscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData.candidat)
    });

    if (candidatResponse.ok) {
      console.log('✅ Compte candidat créé avec succès');
      console.log(`   Email: ${testData.candidat.email}`);
      console.log(`   Mot de passe: ${testData.candidat.mot_de_passe}`);
    } else {
      console.log('❌ Erreur lors de la création du compte candidat:', await candidatResponse.text());
    }

    console.log('\n🎉 Injection terminée !');
    console.log('\n📋 Récapitulatif des comptes créés :');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                    COMPTE ADMIN                         │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│ Email: ${testData.admin.email.padEnd(42)} │`);
    console.log(`│ Mot de passe: ${testData.admin.mot_de_passe.padEnd(36)} │`);
    console.log(`│ Rôle: ${testData.admin.role.padEnd(46)} │`);
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                  COMPTE CANDIDAT                        │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│ Email: ${testData.candidat.email.padEnd(42)} │`);
    console.log(`│ Mot de passe: ${testData.candidat.mot_de_passe.padEnd(36)} │`);
    console.log(`│ Rôle: ${testData.candidat.role.padEnd(46)} │`);
    console.log(`│ Statut: ${testData.candidat.statut.padEnd(44)} │`);
    console.log('└─────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Erreur lors de l\'injection des données:', error.message);
  }
}

// Alternative : Script SQL direct si vous préférez
function genererScriptSQL() {
  const sqlScript = `
-- Script d'injection des données de test
-- À exécuter directement dans votre base de données

-- Insertion du compte admin
INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at) 
VALUES (
  '${testData.admin.nom}',
  '${testData.admin.email}',
  -- Mot de passe hashé (vous devrez le hasher selon votre méthode)
  '$2b$10$hashedPasswordHere', 
  '${testData.admin.role}',
  '${testData.admin.statut}',
  '${testData.admin.telephone}',
  '${testData.admin.addresse}',
  NOW()
);

-- Insertion du compte candidat vérifié
INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, telephone, addresse, created_at) 
VALUES (
  '${testData.candidat.nom}',
  '${testData.candidat.email}',
  -- Mot de passe hashé (vous devrez le hasher selon votre méthode)
  '$2b$10$hashedPasswordHere',
  '${testData.candidat.role}',
  '${testData.candidat.statut}',
  '${testData.candidat.telephone}',
  '${testData.candidat.addresse}',
  NOW()
);

-- Insertion du profil candidat (si table séparée)
INSERT INTO profils_candidats (id_utilisateur, competences, experience, formation, handicap)
SELECT 
  u.id_utilisateur,
  '${JSON.stringify(testData.candidat.profil_candidat.competences)}',
  '${testData.candidat.profil_candidat.experience}',
  '${testData.candidat.profil_candidat.formation}',
  '${testData.candidat.profil_candidat.handicap}'
FROM utilisateurs u 
WHERE u.email = '${testData.candidat.email}';
`;

  console.log('📄 Script SQL généré :');
  console.log(sqlScript);
  return sqlScript;
}

// Exécution
if (process.argv[2] === '--sql') {
  genererScriptSQL();
} else {
  injecterDonnees();
}