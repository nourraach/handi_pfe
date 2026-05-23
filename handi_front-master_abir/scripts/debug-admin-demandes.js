// Script de diagnostic pour l'API admin demandes
// Exécuter dans la console du navigateur pour diagnostiquer le format des données

async function debugAdminDemandes() {
  console.log("🔍 [DEBUG] Début du diagnostic API admin demandes");
  
  const token = localStorage.getItem("token_auth");
  if (!token) {
    console.error("❌ [DEBUG] Aucun token trouvé");
    return;
  }
  
  console.log("🔑 [DEBUG] Token:", token.substring(0, 20) + "...");
  
  try {
    const response = await fetch("http://localhost:4000/api/admin/demandes-en-attente", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("📊 [DEBUG] Status:", response.status);
    console.log("📊 [DEBUG] Headers:", Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log("📦 [DEBUG] Données brutes complètes:", JSON.stringify(data, null, 2));
      console.log("📦 [DEBUG] Type de data:", typeof data);
      console.log("📦 [DEBUG] Clés de data:", Object.keys(data));
      
      // Analyser la structure attendue vs reçue
      console.log("\n🔍 [DEBUG] ANALYSE DE STRUCTURE:");
      console.log("Format attendu: { message: string, donnees: DemandeEnAttente[] }");
      console.log("Format reçu:", {
        message: data.message,
        donnees: data.donnees,
        typeDesDonnees: typeof data.donnees,
        estUnArray: Array.isArray(data.donnees)
      });
      
      if (data.donnees && typeof data.donnees === 'object' && !Array.isArray(data.donnees)) {
        console.log("📋 [DEBUG] Propriétés dans 'donnees':", Object.keys(data.donnees));
        console.log("📋 [DEBUG] Valeurs dans 'donnees':", Object.values(data.donnees));
        
        // Chercher des arrays dans l'objet
        Object.entries(data.donnees).forEach(([key, value]) => {
          console.log(`📋 [DEBUG] ${key}:`, {
            type: typeof value,
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 'N/A',
            content: Array.isArray(value) ? value : 'Non-array'
          });
        });
      }
      
      // Suggestions de correction
      console.log("\n💡 [DEBUG] SUGGESTIONS:");
      if (data.donnees && data.donnees.demandes) {
        console.log("✅ Le backend utilise 'demandes' au lieu de 'donnees' directement");
        console.log("✅ Nombre de demandes:", data.donnees.demandes.length);
      } else if (Array.isArray(data.donnees)) {
        console.log("✅ Format correct détecté");
      } else {
        console.log("❌ Format non reconnu - vérifier l'implémentation backend");
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.error("❌ [DEBUG] Erreur:", response.status, errorText);
    }
  } catch (error) {
    console.error("💥 [DEBUG] Erreur de connexion:", error);
  }
}

// Exécuter le diagnostic
debugAdminDemandes();