/**
 * Script de test détaillé pour la création d'offres
 * 
 * Usage: Copier dans la console après avoir vu le problème
 */

async function testCreationDetaillee() {
  console.log("🧪 === TEST CRÉATION DÉTAILLÉE ===");
  
  const token = localStorage.getItem("token_auth");
  
  // 1. Compter les offres AVANT
  console.log("\n📊 Étape 1: Comptage AVANT création");
  const offresAvant = await compterOffres();
  
  // 2. Créer une offre de test
  console.log("\n➕ Étape 2: Création d'offre de test");
  const offreTest = {
    titre: `Test Détaillé ${Date.now()}`,
    description: "Test pour vérifier l'insertion en base de données avec logs détaillés",
    localisation: "Test",
    type_poste: "CDI",
    salaire_min: 30000,
    salaire_max: 40000
  };
  
  const response = await fetch("http://localhost:4000/api/entreprise/offres", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(offreTest)
  });
  
  console.log("📡 Status création:", response.status);
  
  if (response.ok) {
    const data = await response.json();
    console.log("✅ Réponse:", data);
    const idCree = data.donnees?.id_offre;
    
    // 3. Attendre un peu (au cas où il y aurait un délai)
    console.log("\n⏳ Étape 3: Attente de 2 secondes...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Compter les offres APRÈS
    console.log("\n📊 Étape 4: Comptage APRÈS création");
    const offresApres = await compterOffres();
    
    // 5. Analyser la différence
    console.log("\n📈 Étape 5: Analyse");
    console.log(`Offres avant: ${offresAvant}`);
    console.log(`Offres après: ${offresApres}`);
    console.log(`Différence: ${offresApres - offresAvant}`);
    
    if (offresApres > offresAvant) {
      console.log("✅ L'offre a été ajoutée en base !");
    } else {
      console.log("❌ L'offre N'A PAS été ajoutée en base !");
      console.log("🔍 Problème côté backend : l'insertion échoue silencieusement");
    }
    
    // 6. Chercher l'offre spécifiquement
    if (idCree) {
      console.log(`\n🔍 Étape 6: Recherche de l'offre ID ${idCree}`);
      await chercherOffreParId(idCree);
    }
    
  } else {
    console.log("❌ Échec de la création:", await response.text());
  }
}

async function compterOffres() {
  const token = localStorage.getItem("token_auth");
  
  try {
    const response = await fetch("http://localhost:4000/api/entreprise/offres", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const count = data.donnees?.offres?.length || 0;
      console.log(`📋 ${count} offre(s) trouvée(s)`);
      return count;
    } else {
      console.log("❌ Erreur lors du comptage:", response.status);
      return 0;
    }
  } catch (error) {
    console.log("💥 Erreur:", error);
    return 0;
  }
}

async function chercherOffreParId(idOffre) {
  const token = localStorage.getItem("token_auth");
  
  try {
    const response = await fetch("http://localhost:4000/api/entreprise/offres", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const offres = data.donnees?.offres || [];
      const offreTrouvee = offres.find(o => o.id_offre == idOffre);
      
      if (offreTrouvee) {
        console.log("✅ Offre trouvée dans la liste:", offreTrouvee);
      } else {
        console.log("❌ Offre NON trouvée dans la liste");
        console.log("📋 IDs disponibles:", offres.map(o => o.id_offre));
      }
    }
  } catch (error) {
    console.log("💥 Erreur lors de la recherche:", error);
  }
}

// Exécuter le test
testCreationDetaillee();