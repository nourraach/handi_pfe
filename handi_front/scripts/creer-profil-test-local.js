// Script pour créer des données de profil de test dans le navigateur
// À exécuter dans la console du navigateur (F12)

function creerProfilTestLocal() {
  console.log('🏗️ Création de données de profil de test...');
  
  // Récupérer l'utilisateur connecté
  const utilisateurData = localStorage.getItem('utilisateur_connecte');
  
  if (!utilisateurData) {
    console.error('❌ Aucun utilisateur connecté trouvé');
    console.log('💡 Connectez-vous d\'abord, puis réexécutez ce script');
    return;
  }
  
  const utilisateur = JSON.parse(utilisateurData);
  console.log('👤 Utilisateur connecté:', utilisateur.nom, '(' + utilisateur.role + ')');
  
  if (utilisateur.role === 'candidat') {
    // Créer un profil candidat de test
    const profilCandidat = {
      nom: utilisateur.nom || 'Jean Dupont',
      email: utilisateur.email || 'jean.dupont@example.com',
      telephone: '0123456789',
      addresse: '123 Rue de la République, 75001 Paris',
      competences: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
      experience: 'Développeur Full-Stack avec 3 ans d\'expérience dans le développement d\'applications web modernes. Expérience en React, Node.js et bases de données relationnelles.',
      formation: 'Master en Informatique - Université Paris Diderot (2021)\\nLicence en Informatique - Université Paris Diderot (2019)',
      handicap: 'Mobilité réduite - Besoin d\'un poste de travail adapté et d\'un accès facilité aux locaux.',
      disponibilite: 'Immédiate',
      salaire_souhaite: '38000€ annuel'
    };
    
    const profilKey = `profil_candidat_${utilisateur.id_utilisateur}`;
    localStorage.setItem(profilKey, JSON.stringify(profilCandidat));
    
    // Mettre à jour aussi les données utilisateur de base
    utilisateur.nom = profilCandidat.nom;
    utilisateur.email = profilCandidat.email;
    utilisateur.telephone = profilCandidat.telephone;
    utilisateur.addresse = profilCandidat.addresse;
    localStorage.setItem('utilisateur_connecte', JSON.stringify(utilisateur));
    
    console.log('✅ Profil candidat créé avec succès !');
    console.log('📋 Données créées:', profilCandidat);
    
  } else if (utilisateur.role === 'entreprise') {
    // Créer un profil entreprise de test
    const profilEntreprise = {
      nom: utilisateur.nom || 'TechCorp SARL',
      email: utilisateur.email || 'contact@techcorp.com',
      telephone: '0145678901',
      addresse: '456 Avenue de l\'Innovation, 92000 Nanterre',
      secteur: 'Technologies de l\'Information',
      taille: '50-100 employés',
      description: 'Entreprise spécialisée dans le développement de solutions web et mobiles innovantes. Nous accompagnons nos clients dans leur transformation digitale.',
      site_web: 'https://www.techcorp-example.com',
      siret: '12345678901234',
      contact_rh: 'Marie Dubois - Responsable RH'
    };
    
    const profilKey = `profil_entreprise_${utilisateur.id_utilisateur}`;
    localStorage.setItem(profilKey, JSON.stringify(profilEntreprise));
    
    // Mettre à jour les données utilisateur de base
    utilisateur.nom = profilEntreprise.nom;
    utilisateur.email = profilEntreprise.email;
    utilisateur.telephone = profilEntreprise.telephone;
    utilisateur.addresse = profilEntreprise.addresse;
    localStorage.setItem('utilisateur_connecte', JSON.stringify(utilisateur));
    
    console.log('✅ Profil entreprise créé avec succès !');
    console.log('📋 Données créées:', profilEntreprise);
    
  } else if (utilisateur.role === 'admin') {
    // Créer un profil admin de test
    const profilAdmin = {
      nom: utilisateur.nom || 'Admin Système',
      email: utilisateur.email || 'admin@handitalents.com',
      telephone: '0156789012',
      addresse: '789 Rue de l\'Administration, 75008 Paris',
      poste: 'Administrateur Système',
      departement: 'IT & Support',
      date_embauche: '2023-01-15',
      niveau_acces: 'Super Admin'
    };
    
    const profilKey = `profil_admin_${utilisateur.id_utilisateur}`;
    localStorage.setItem(profilKey, JSON.stringify(profilAdmin));
    
    // Mettre à jour les données utilisateur de base
    utilisateur.nom = profilAdmin.nom;
    utilisateur.email = profilAdmin.email;
    utilisateur.telephone = profilAdmin.telephone;
    utilisateur.addresse = profilAdmin.addresse;
    localStorage.setItem('utilisateur_connecte', JSON.stringify(utilisateur));
    
    console.log('✅ Profil admin créé avec succès !');
    console.log('📋 Données créées:', profilAdmin);
  }
  
  console.log('🔄 Actualisez la page profil pour voir les nouvelles données !');
  console.log('💡 Les données sont sauvegardées localement et persisteront entre les sessions.');
}

// Fonction pour nettoyer les données de test
function nettoyerProfilTest() {
  const utilisateurData = localStorage.getItem('utilisateur_connecte');
  if (utilisateurData) {
    const utilisateur = JSON.parse(utilisateurData);
    const profilKey = `profil_${utilisateur.role}_${utilisateur.id_utilisateur}`;
    localStorage.removeItem(profilKey);
    console.log('🧹 Données de profil supprimées');
  }
}

// Fonction pour afficher les données actuelles
function afficherProfilActuel() {
  const utilisateurData = localStorage.getItem('utilisateur_connecte');
  if (utilisateurData) {
    const utilisateur = JSON.parse(utilisateurData);
    const profilKey = `profil_${utilisateur.role}_${utilisateur.id_utilisateur}`;
    const profil = localStorage.getItem(profilKey);
    
    console.log('👤 Utilisateur:', utilisateur);
    console.log('📋 Profil:', profil ? JSON.parse(profil) : 'Aucun profil sauvegardé');
  }
}

// Instructions d'utilisation
console.log('📋 INSTRUCTIONS:');
console.log('1. Copiez-collez ce script dans la console du navigateur (F12)');
console.log('2. Exécutez: creerProfilTestLocal()');
console.log('3. Actualisez la page profil');
console.log('4. Optionnel: nettoyerProfilTest() pour supprimer les données');
console.log('5. Optionnel: afficherProfilActuel() pour voir les données actuelles');

// Auto-exécution si dans le navigateur
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  creerProfilTestLocal();
}