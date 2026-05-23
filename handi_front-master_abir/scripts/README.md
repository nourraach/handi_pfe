# Scripts d'injection des données de test

Ce dossier contient les scripts pour injecter des comptes de test dans votre application.

## 📋 Comptes créés

### 👨‍💼 Compte Admin
- **Email**: `admin@test.com`
- **Mot de passe**: `AdminTest123!`
- **Rôle**: admin
- **Statut**: actif

### 👤 Compte Candidat (vérifié)
- **Email**: `candidat@test.com`
- **Mot de passe**: `CandidatTest123!`
- **Rôle**: candidat
- **Statut**: actif (déjà vérifié par l'admin)

## 🚀 Utilisation

### Option 1 : Via l'API (Recommandé)

```bash
# Assurez-vous que votre API backend est démarrée sur le port 4000
node scripts/inject-test-data.js
```

### Option 2 : Script SQL direct

```bash
# Générer le script SQL
node scripts/inject-test-data.js --sql

# Ou utiliser directement le fichier SQL
# Exécutez le contenu de scripts/test-data.sql dans votre base de données
```

### Option 3 : Injection SQL directe

Si vous avez accès direct à votre base de données :

```sql
-- Exécutez le contenu du fichier test-data.sql
-- dans votre client de base de données (phpMyAdmin, pgAdmin, etc.)
```

## ⚠️ Notes importantes

1. **Mots de passe** : Les mots de passe dans le script SQL sont des exemples hashés. Vous devrez les remplacer par des hash valides selon votre méthode de hashage.

2. **Structure de la base** : Adaptez les noms de tables et colonnes selon votre schéma de base de données.

3. **API Backend** : Assurez-vous que votre API backend est démarrée avant d'exécuter le script JavaScript.

4. **Environnement** : Ces comptes sont destinés au développement/test uniquement.

## 🔧 Personnalisation

Vous pouvez modifier les données dans `inject-test-data.js` pour adapter :
- Les informations personnelles
- Les mots de passe
- Les profils candidats
- Les adresses email