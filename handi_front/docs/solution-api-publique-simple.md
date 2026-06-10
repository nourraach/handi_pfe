# Solution Simple : API Publique pour les Offres

## 🎯 **Objectif**
Permettre aux candidats de voir toutes les offres actives sans modifier l'architecture existante.

---

## 🔧 **SOLUTION 1 : Modifier l'API Entreprise Existante**

### **Modification de `GET /api/entreprise/offres`**

```javascript
app.get('/api/entreprise/offres', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    // CAS 1: Pas d'authentification = Mode public (pour candidats)
    if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
      console.log('Mode public - Retour des offres actives');
      
      const offresPubliques = await db.query(`
        SELECT 
          oe.id_offre,
          oe.titre,
          oe.description,
          oe.localisation,
          oe.type_poste,
          oe.salaire_min,
          oe.salaire_max,
          oe.competences_requises,
          oe.experience_requise,
          oe.niveau_etude,
          oe.statut,
          oe.date_limite,
          oe.created_at,
          oe.candidatures_count,
          oe.vues_count,
          u.nom as nom_entreprise
        FROM offres_emploi oe
        JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
        WHERE oe.statut = 'active'
        ORDER BY oe.created_at DESC
      `);
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres: offresPubliques }
      });
    }
    
    // CAS 2: Avec authentification = Mode entreprise/admin
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role === 'entreprise') {
        // Retourner seulement les offres de cette entreprise
        const offresEntreprise = await db.query(`
          SELECT * FROM offres_emploi 
          WHERE id_entreprise = ? 
          ORDER BY created_at DESC
        `, [decoded.id_utilisateur]);
        
        return res.json({
          message: 'Offres de l\'entreprise récupérées avec succès',
          donnees: { offres: offresEntreprise }
        });
      }
      
      if (decoded.role === 'admin') {
        // Admin voit toutes les offres
        const toutesOffres = await db.query(`
          SELECT 
            oe.*,
            u.nom as nom_entreprise
          FROM offres_emploi oe
          JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
          ORDER BY oe.created_at DESC
        `);
        
        return res.json({
          message: 'Toutes les offres récupérées avec succès',
          donnees: { offres: toutesOffres }
        });
      }
      
      // Autres rôles (candidat avec token) = mode public
      const offresPubliques = await db.query(`
        SELECT 
          oe.id_offre,
          oe.titre,
          oe.description,
          oe.localisation,
          oe.type_poste,
          oe.salaire_min,
          oe.salaire_max,
          oe.competences_requises,
          oe.experience_requise,
          oe.niveau_etude,
          oe.statut,
          oe.date_limite,
          oe.created_at,
          oe.candidatures_count,
          oe.vues_count,
          u.nom as nom_entreprise
        FROM offres_emploi oe
        JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
        WHERE oe.statut = 'active'
        ORDER BY oe.created_at DESC
      `);
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres: offresPubliques }
      });
      
    } catch (jwtError) {
      // Token invalide = mode public
      console.log('Token invalide, mode public activé');
      
      const offresPubliques = await db.query(`
        SELECT 
          oe.id_offre,
          oe.titre,
          oe.description,
          oe.localisation,
          oe.type_poste,
          oe.salaire_min,
          oe.salaire_max,
          oe.competences_requises,
          oe.experience_requise,
          oe.niveau_etude,
          oe.statut,
          oe.date_limite,
          oe.created_at,
          oe.candidatures_count,
          oe.vues_count,
          u.nom as nom_entreprise
        FROM offres_emploi oe
        JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
        WHERE oe.statut = 'active'
        ORDER BY oe.created_at DESC
      `);
      
      return res.json({
        message: 'Offres publiques récupérées avec succès',
        donnees: { offres: offresPubliques }
      });
    }
    
  } catch (error) {
    console.error('Erreur récupération offres:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 🔧 **SOLUTION 2 : Nouvelle API Publique (Plus Propre)**

### **Ajouter `GET /api/offres/publiques`**

```javascript
app.get('/api/offres/publiques', async (req, res) => {
  try {
    const offresPubliques = await db.query(`
      SELECT 
        oe.id_offre,
        oe.titre,
        oe.description,
        oe.localisation,
        oe.type_poste,
        oe.salaire_min,
        oe.salaire_max,
        oe.competences_requises,
        oe.experience_requise,
        oe.niveau_etude,
        oe.statut,
        oe.date_limite,
        oe.created_at,
        oe.candidatures_count,
        oe.vues_count,
        u.nom as nom_entreprise
      FROM offres_emploi oe
      JOIN utilisateurs u ON oe.id_entreprise = u.id_utilisateur
      WHERE oe.statut = 'active'
      ORDER BY oe.created_at DESC
    `);
    
    res.json({
      message: 'Offres publiques récupérées avec succès',
      donnees: { offres: offresPubliques }
    });
  } catch (error) {
    console.error('Erreur récupération offres publiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

---

## 🧪 **TEST RAPIDE**

### **Test dans le navigateur (Console F12)**

```javascript
// Test de l'API modifiée
fetch('http://localhost:4000/api/entreprise/offres', {
  headers: { 'Content-Type': 'application/json' }
  // Pas de token = mode public
})
.then(res => res.json())
.then(data => {
  console.log('✅ Offres publiques:', data.donnees.offres.length);
  console.log('📋 Première offre:', data.donnees.offres[0]);
});
```

### **Test avec curl**

```bash
# Test sans authentification (mode public)
curl -X GET http://localhost:4000/api/entreprise/offres \
  -H "Content-Type: application/json"

# Test avec token entreprise (mode privé)
curl -X GET http://localhost:4000/api/entreprise/offres \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ENTERPRISE_TOKEN"
```

---

## 🎯 **AVANTAGES DE LA SOLUTION 1**

✅ **Aucune nouvelle route** à créer
✅ **Rétrocompatible** avec l'existant
✅ **Logique simple** : pas de token = public, avec token = privé
✅ **Fonctionne immédiatement** avec le frontend actuel

---

## 🎯 **AVANTAGES DE LA SOLUTION 2**

✅ **Plus propre** architecturalement
✅ **Séparation claire** public/privé
✅ **Plus facile à maintenir**
✅ **Meilleure sécurité**

---

## 📋 **RECOMMANDATION**

**Utilisez la Solution 1** pour une implémentation rapide. Votre frontend basculera automatiquement vers les vraies données dès que vous modifierez l'API.

Le frontend est déjà configuré pour :
1. Essayer `/api/offres/publiques` (Solution 2)
2. Fallback vers `/api/entreprise/offres` sans token (Solution 1)
3. Fallback vers données de test

**Une seule modification backend suffit pour que tout fonctionne !** 🚀