# Logique de Calcul des Scores - Tests Psychologiques

## 🚨 Problèmes identifiés

### 1. Questions Vrai/Faux
- ❌ **Problème** : Les deux options étaient marquées comme incorrectes par défaut
- ❌ **Problème** : "Vrai" recevait le score complet même si incorrect
- ✅ **Solution** : "Vrai" est correct par défaut, "Faux" est incorrect

### 2. Échelle Likert
- ❌ **Problème** : Toutes les options étaient marquées comme "correctes"
- ✅ **Solution** : Aucune option n'est "correcte" (c'est une échelle d'opinion)

### 3. Calcul Backend
- ❌ **Problème** : Utilise toujours `score_option` sans logique métier
- ✅ **Solution** : Logique différente selon le type de question

## 📊 Logique de scoring correcte

### Type 1: Choix Multiple
```javascript
// Logique: Seules les options marquées "correctes" donnent des points
if (option.est_correcte) {
  score = option.score_option;
} else {
  score = 0;
}
```

### Type 2: Vrai/Faux
```javascript
// Logique: Réponse correcte = score complet, incorrecte = 0
if (option.est_correcte) {
  score = question.score_question;
} else {
  score = 0;
}
```

### Type 3: Échelle Likert
```javascript
// Logique: Chaque niveau a sa valeur (1-5 points)
score = option.score_option; // 1, 2, 3, 4, ou 5
```

### Type 4: Texte Libre
```javascript
// Logique: Score complet par défaut (ajustable manuellement)
score = question.score_question;
```

## 🔧 Corrections nécessaires

### Frontend (✅ Corrigé)
- `components/question-editor.tsx` : Options Vrai/Faux et Likert corrigées

### Backend (❌ À corriger)
Le backend doit implémenter cette logique dans l'endpoint de soumission :

```javascript
// Dans /candidat/tests/:id/soumettre
for (const reponse of reponses) {
  let scoreAttribue = 0;
  
  if (reponse.id_option) {
    const [optionInfo] = await connection.execute(
      `SELECT o.score_option, o.est_correcte, q.score_question, q.type_question
      FROM options_reponse o
      JOIN questions q ON o.id_question = q.id_question
      WHERE o.id_option = ? AND q.id_question = ?`,
      [reponse.id_option, reponse.id_question]
    );
    
    if (optionInfo.length > 0) {
      const { score_option, est_correcte, score_question, type_question } = optionInfo[0];
      
      switch (type_question) {
        case 'choix_multiple':
          scoreAttribue = est_correcte ? score_option : 0;
          break;
          
        case 'vrai_faux':
          scoreAttribue = est_correcte ? score_question : 0;
          break;
          
        case 'echelle_likert':
          scoreAttribue = score_option; // 1-5 points
          break;
          
        default:
          scoreAttribue = 0;
      }
    }
  } else if (reponse.reponse_texte) {
    // Texte libre : score complet
    const [questionInfo] = await connection.execute(
      'SELECT score_question FROM questions WHERE id_question = ?',
      [reponse.id_question]
    );
    
    if (questionInfo.length > 0) {
      scoreAttribue = questionInfo[0].score_question;
    }
  }
  
  scoreObtenu += scoreAttribue;
  
  // Enregistrer la réponse avec le score calculé
  await connection.execute(
    `INSERT INTO reponses_candidats 
     (id_reponse, id_resultat, id_question, id_option, reponse_texte, score_attribue)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), resultatId, reponse.id_question, reponse.id_option || null, reponse.reponse_texte || null, scoreAttribue]
  );
}
```

## 🎯 Exemples concrets

### Exemple 1: Question Vrai/Faux (10 points)
- **Question** : "La communication non-verbale est importante"
- **Réponse correcte** : "Vrai" → 10 points
- **Réponse incorrecte** : "Faux" → 0 points

### Exemple 2: Choix Multiple (15 points)
- **Question** : "Comment gérer un conflit ?"
- **Option A** (correcte, 15 pts) : "Écouter toutes les parties" → 15 points
- **Option B** (incorrecte, 5 pts) : "Imposer sa solution" → 0 points
- **Option C** (correcte, 10 pts) : "Chercher un compromis" → 10 points

### Exemple 3: Échelle Likert (5 points max)
- **Question** : "À quel point êtes-vous organisé ?"
- **Réponse "3 - Moyennement"** → 3 points
- **Réponse "5 - Très organisé"** → 5 points

## 📋 Actions requises

### ✅ Frontend (Corrigé)
- Questions Vrai/Faux : "Vrai" correct par défaut
- Échelle Likert : Aucune option "correcte"

### ❌ Backend (À implémenter)
1. Modifier l'endpoint `/candidat/tests/:id/soumettre`
2. Ajouter la logique de scoring par type de question
3. Tester avec différents types de questions
4. Vérifier que les pourcentages sont corrects

### 🧪 Tests nécessaires
1. Créer un test avec tous les types de questions
2. Passer le test avec différentes réponses
3. Vérifier que les scores sont cohérents
4. Contrôler les pourcentages calculés

## 🚀 Impact de la correction

### Avant
- ❌ Scores incohérents
- ❌ Questions Vrai/Faux mal configurées
- ❌ Échelle Likert avec logique "correct/incorrect"
- ❌ Calcul backend simpliste

### Après
- ✅ Scores logiques selon le type de question
- ✅ Questions Vrai/Faux avec bonne réponse par défaut
- ✅ Échelle Likert comme échelle d'opinion
- ✅ Calcul backend intelligent

La correction du backend est **critique** pour avoir des résultats de tests fiables ! 🎯