# Plan d'Action Immédiat - Finalisation du Projet

## 🎯 **ÉTAT ACTUEL CONFIRMÉ**

✅ **Serveur backend** : Fonctionnel sur localhost:4000  
✅ **Frontend** : Fonctionnel sur localhost:3000  
✅ **APIs existantes** : Authentification, tests psychologiques, gestion utilisateurs  
⚠️ **APIs manquantes** : Profils, offres publiques, candidatures  

---

## 🚀 **ACTIONS IMMÉDIATES PRIORITAIRES**

### **1. DIAGNOSTIC OFFRES ENTREPRISE (5 min)**

Le backend API fonctionne (401 = serveur répond), mais il faut vérifier pourquoi les offres ne s'affichent pas côté frontend.

#### **Test à effectuer dans le navigateur :**
1. Aller sur `/entreprise/offres`
2. Ouvrir F12 → Console
3. Exécuter ce code :

```javascript
// Vérifier l'utilisateur connecté
const utilisateur = JSON.parse(localStorage.getItem('utilisateur_connecte') || '{}');
console.log('👤 Utilisateur:', utilisateur.role, utilisateur.nom);

// Tester l'API
const token = localStorage.getItem('token_auth');
fetch('http://localhost:4000/api/entreprise/offres', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('📊 Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('📦 Données:', data);
  console.log('📋 Nombre offres:', data.donnees?.offres?.length);
})
.catch(err => console.error('❌ Erreur:', err));
```

#### **Solutions possibles :**
- Si l'API retourne des données mais rien ne s'affiche → Problème React (état, rendu)
- Si l'API retourne 401/403 → Problème d'authentification
- Si l'API retourne 404 → Endpoint non implémenté

### **2. IMPLÉMENTATION BACKEND PRIORITAIRE (30 min)**

#### **A. Modifier l'API offres pour le mode public**
Ajouter cette logique dans votre backend :

```javascript
// Dans votre fichier backend principal
app.get('/api/entreprise/offres', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Mode public si pas de token
    if (!authHeader || authHeader === 'Bearer null') {
      const offresPubliques = await db.query(`
        SELECT oe.*, u.nom as nom_entreprise
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
    
    // Mode authentifié (code existant)
    // ... votre logique actuelle
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

#### **B. Créer les tables profils**
Exécuter ce SQL dans votre base de données :

```sql
CREATE TABLE profils_candidats (
  id_candidat VARCHAR(255) PRIMARY KEY,
  competences JSON,
  experience TEXT,
  formation TEXT,
  handicap TEXT,
  disponibilite VARCHAR(100) DEFAULT 'Immédiate',
  salaire_souhaite VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_candidat) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE profils_entreprises (
  id_entreprise VARCHAR(255) PRIMARY KEY,
  secteur_activite VARCHAR(255),
  description_entreprise TEXT,
  site_web VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES utilisateurs(id_utilisateur)
);
```

#### **C. Implémenter les APIs profils de base**
Ajouter ces endpoints dans votre backend :

```javascript
// GET profil candidat
app.get('/api/candidats/profil/:id', authenticateToken, async (req, res) => {
  try {
    const profil = await db.query(`
      SELECT u.nom, u.email, u.telephone, u.addresse,
             pc.competences, pc.experience, pc.formation
      FROM utilisateurs u
      LEFT JOIN profils_candidats pc ON u.id_utilisateur = pc.id_candidat
      WHERE u.id_utilisateur = ?
    `, [req.params.id]);
    
    res.json({ message: 'Profil récupéré', donnees: profil[0] || {} });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT profil candidat
app.put('/api/candidats/profil', authenticateToken, async (req, res) => {
  try {
    const { nom, email, telephone, addresse, competences, experience, formation } = req.body;
    const id = req.user.id_utilisateur;
    
    // Mettre à jour utilisateur
    await db.query(`
      UPDATE utilisateurs SET nom=?, email=?, telephone=?, addresse=? WHERE id_utilisateur=?
    `, [nom, email, telephone, addresse, id]);
    
    // Insérer/mettre à jour profil
    await db.query(`
      INSERT INTO profils_candidats (id_candidat, competences, experience, formation)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE competences=VALUES(competences), experience=VALUES(experience), formation=VALUES(formation)
    `, [id, JSON.stringify(competences || []), experience, formation]);
    
    res.json({ message: 'Profil mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

### **3. TESTS IMMÉDIATS (10 min)**

#### **A. Tester les profils**
1. Aller sur `/profil`
2. Vérifier si les données s'affichent maintenant
3. Essayer de modifier et sauvegarder

#### **B. Tester les offres publiques**
1. Aller sur `/offres` (page candidat)
2. Vérifier si les vraies offres s'affichent
3. Essayer de postuler (devrait marcher en mode local)

#### **C. Tester les offres entreprise**
1. Se connecter en tant qu'entreprise
2. Aller sur `/entreprise/offres`
3. Vérifier l'affichage et la création d'offres

---

## 📋 **CHECKLIST DE VALIDATION**

### **Phase 1 : Diagnostic (5 min)**
- [ ] Serveur backend accessible
- [ ] Frontend accessible
- [ ] Console browser sans erreurs critiques
- [ ] Utilisateur connecté correctement

### **Phase 2 : Corrections backend (30 min)**
- [ ] API offres modifiée pour mode public
- [ ] Tables profils créées
- [ ] APIs profils implémentées
- [ ] Tests API avec Postman/curl

### **Phase 3 : Tests frontend (10 min)**
- [ ] Profils affichent les données
- [ ] Offres publiques fonctionnelles
- [ ] Offres entreprise affichées
- [ ] Création d'offres fonctionnelle

### **Phase 4 : Finalisation (15 min)**
- [ ] Nettoyage des logs de debug
- [ ] Vérification de toutes les pages
- [ ] Test complet du workflow utilisateur
- [ ] Documentation mise à jour

---

## 🎯 **RÉSULTAT ATTENDU**

Après ces actions (1h maximum), le projet devrait être :
- ✅ **100% fonctionnel** pour les fonctionnalités principales
- ✅ **Profils** : Affichage et modification des données utilisateur
- ✅ **Offres publiques** : Candidats voient toutes les offres actives
- ✅ **Offres entreprise** : Création, modification, gestion complète
- ✅ **Navigation** : Toutes les pages accessibles sans 404

---

## 🚨 **SI PROBLÈME PERSISTANT**

Si après le diagnostic l'affichage des offres ne fonctionne toujours pas :

1. **Vérifier l'état React** avec les DevTools
2. **Forcer le rechargement** des données
3. **Nettoyer le localStorage** et recommencer
4. **Vérifier les conditions de rendu** dans le composant

**Le projet est très proche d'être terminé - ces corrections devraient suffire !** 🚀