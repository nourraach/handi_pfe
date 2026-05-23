# 🎯 GUIDE FRONTEND - PROCESSUS DE CANDIDATURE HANDITALENTS

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation frontend pour le processus complet de candidature HandiTalents, avec toutes les interfaces utilisateur nécessaires pour candidats, entreprises et administrateurs.

## 🏗️ ARCHITECTURE FRONTEND

### Structure des composants recommandée :
```
src/
├── components/
│   ├── candidat/
│   │   ├── OffresList.tsx
│   │   ├── OffreDetail.tsx
│   │   ├── PostulerModal.tsx
│   │   ├── MesCandidatures.tsx
│   │   ├── MesEntretiens.tsx
│   │   ├── MesFavoris.tsx
│   │   └── Notifications.tsx
│   ├── entreprise/
│   │   ├── CreerOffre.tsx
│   │   ├── MesOffres.tsx
│   │   ├── CandidaturesRecues.tsx
│   │   ├── GestionEntretiens.tsx
│   │   └── StatistiquesRH.tsx
│   ├── admin/
│   │   ├── SupervisionCandidatures.tsx
│   │   ├── WorkflowRecrutement.tsx
│   │   ├── DetectionAbus.tsx
│   │   └── StatistiquesGlobales.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── FilterBar.tsx
│       └── Pagination.tsx
├── services/
│   ├── api.ts
│   ├── candidatureService.ts
│   ├── offreService.ts
│   └── notificationService.ts
├── types/
│   └── candidature.types.ts
└── utils/
    ├── dateUtils.ts
    └── statusUtils.ts
```

## 🔌 CONFIGURATION API

### Base URL et authentification
```typescript
// services/api.ts
const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
## 📝 TYPES TYPESCRIPT

### Types principaux
```typescript
// types/candidature.types.ts
export interface OffreEmploi {
  id: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: 'cdi' | 'cdd' | 'stage' | 'freelance' | 'temps_partiel' | 'temps_plein';
  salaire_min?: string;
  salaire_max?: string;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  statut: 'active' | 'inactive' | 'pourvue' | 'expiree';
  date_limite?: string;
  accessibilite_handicap: boolean;
  amenagements_possibles?: string;
  entreprise: {
    nom: string;
    secteur_activite?: string;
  };
  created_at: string;
}

export interface Candidature {
  id: string;
  date_postulation: string;
  statut: 'pending' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'accepted';
  motif_refus?: string;
  score_test?: number;
  lettre_motivation?: string;
  cv_url?: string;
  notes_entreprise?: string;
  offre: {
    titre: string;
    localisation: string;
    type_poste: string;
  };
  entreprise: {
    nom: string;
  };
}

export interface Entretien {
  id: string;
  date_heure: string;
  type: 'visio' | 'presentiel' | 'telephonique';
  lieu_visio?: string;
  lieu?: string;
  statut: 'planifie' | 'confirme' | 'reporte' | 'annule' | 'termine';
  notes?: string;
  duree_prevue?: string;
  contact_entreprise?: string;
  offre: {
    titre: string;
  };
  entreprise: {
    nom: string;
    contact_rh_nom?: string;
    contact_rh_email?: string;
  };
}

export interface Notification {
  id: string;
  type: 'candidature_status_change' | 'interview_scheduled' | 'new_message' | 'offre_favorite_updated' | 'system';
  titre: string;
  message: string;
  lu: boolean;
  data?: any;
  created_at: string;
}
```
## 🛠️ SERVICES API

### Service des offres d'emploi
```typescript
// services/offreService.ts
export class OffreService {
  // Récupérer toutes les offres (public)
  static async getOffres(filtres?: {
    titre?: string;
    localisation?: string;
    type_poste?: string;
    salaire_min?: string;
    salaire_max?: string;
    competences?: string[];
    accessibilite_handicap?: boolean;
    page?: number;
    limit?: number;
  }): Promise<OffreEmploi[]> {
    const params = new URLSearchParams();
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const response = await api.get(`/offres-emploi?${params}`);
    return response.data.data;
  }

  // Récupérer une offre par ID
  static async getOffreById(id: string): Promise<OffreEmploi> {
    const response = await api.get(`/offres-emploi/${id}`);
    return response.data.data;
  }

  // Créer une offre (entreprise)
  static async creerOffre(offre: Partial<OffreEmploi>): Promise<OffreEmploi> {
    const response = await api.post('/offres-emploi', offre);
    return response.data.data;
  }

  // Modifier une offre (entreprise)
  static async modifierOffre(id: string, offre: Partial<OffreEmploi>): Promise<OffreEmploi> {
    const response = await api.put(`/offres-emploi/${id}`, offre);
    return response.data.data;
  }

  // Supprimer une offre (entreprise)
  static async supprimerOffre(id: string): Promise<void> {
    await api.delete(`/offres-emploi/${id}`);
  }

  // Récupérer mes offres (entreprise)
  static async getMesOffres(): Promise<OffreEmploi[]> {
    const response = await api.get('/offres-emploi/entreprise/mes-offres');
    return response.data.data;
  }
}
```
### Service des candidatures
```typescript
// services/candidatureService.ts
export class CandidatureService {
  // Postuler à une offre (candidat)
  static async postuler(candidature: {
    id_offre: string;
    lettre_motivation?: string;
    cv_url?: string;
  }): Promise<Candidature> {
    const response = await api.post('/candidatures/postuler', candidature);
    return response.data.data;
  }

  // Récupérer mes candidatures (candidat)
  static async getMesCandidatures(): Promise<Candidature[]> {
    const response = await api.get('/candidatures/mes-candidatures');
    return response.data.data;
  }

  // Récupérer candidatures reçues (entreprise)
  static async getCandidaturesEntreprise(filtres?: {
    statut?: string;
    score_min?: number;
    score_max?: number;
    competences?: string[];
    date_debut?: string;
    date_fin?: string;
    page?: number;
    limit?: number;
  }): Promise<Candidature[]> {
    const params = new URLSearchParams();
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const response = await api.get(`/candidatures/entreprise?${params}`);
    return response.data.data;
  }

  // Shortlister un candidat (entreprise)
  static async shortlister(candidatureId: string): Promise<Candidature> {
    const response = await api.post(`/candidatures/${candidatureId}/shortlist`);
    return response.data.data;
  }

  // Refuser un candidat (entreprise)
  static async refuser(candidatureId: string, motif?: string): Promise<Candidature> {
    const response = await api.post(`/candidatures/${candidatureId}/refuser`, {
      motif_refus: motif
    });
    return response.data.data;
  }

  // Accepter un candidat (entreprise)
  static async accepter(candidatureId: string): Promise<Candidature> {
    const response = await api.post(`/candidatures/${candidatureId}/accepter`);
    return response.data.data;
  }

  // Récupérer statistiques (entreprise)
  static async getStatistiques(): Promise<any> {
    const response = await api.get('/candidatures/statistiques');
    return response.data.data;
  }
}
```
### Service des entretiens
```typescript
// services/entretienService.ts
export class EntretienService {
  // Planifier un entretien (entreprise)
  static async planifierEntretien(entretien: {
    id_candidature: string;
    date_heure: string;
    type: 'visio' | 'presentiel' | 'telephonique';
    lieu_visio?: string;
    lieu?: string;
    duree_prevue?: string;
    contact_entreprise?: string;
    notes?: string;
  }): Promise<Entretien> {
    const response = await api.post('/entretiens/planifier', entretien);
    return response.data.data;
  }

  // Récupérer entretiens entreprise
  static async getEntretiensEntreprise(): Promise<Entretien[]> {
    const response = await api.get('/entretiens/entreprise');
    return response.data.data;
  }

  // Récupérer mes entretiens (candidat)
  static async getMesEntretiens(): Promise<Entretien[]> {
    const response = await api.get('/entretiens/candidat');
    return response.data.data;
  }

  // Modifier un entretien (entreprise)
  static async modifierEntretien(id: string, modifications: Partial<Entretien>): Promise<Entretien> {
    const response = await api.put(`/entretiens/${id}`, modifications);
    return response.data.data;
  }

  // Annuler un entretien (entreprise)
  static async annulerEntretien(id: string, motif?: string): Promise<Entretien> {
    const response = await api.post(`/entretiens/${id}/annuler`, { motif });
    return response.data.data;
  }

  // Confirmer un entretien (candidat)
  static async confirmerEntretien(id: string): Promise<Entretien> {
    const response = await api.post(`/entretiens/${id}/confirmer`);
    return response.data.data;
  }

  // Terminer un entretien (entreprise)
  static async terminerEntretien(id: string, notes?: string): Promise<Entretien> {
    const response = await api.post(`/entretiens/${id}/terminer`, { notes });
    return response.data.data;
  }
}
```
### Service des favoris et notifications
```typescript
// services/favorisService.ts
export class FavorisService {
  // Ajouter aux favoris
  static async ajouterFavori(idOffre: string): Promise<void> {
    await api.post(`/favoris/${idOffre}`);
  }

  // Retirer des favoris
  static async retirerFavori(idOffre: string): Promise<void> {
    await api.delete(`/favoris/${idOffre}`);
  }

  // Récupérer mes favoris
  static async getMesFavoris(): Promise<any[]> {
    const response = await api.get('/favoris');
    return response.data.data;
  }

  // Vérifier si une offre est en favoris
  static async verifierFavori(idOffre: string): Promise<boolean> {
    const response = await api.get(`/favoris/${idOffre}/verifier`);
    return response.data.data.est_favori;
  }
}

// services/notificationService.ts
export class NotificationService {
  // Récupérer mes notifications
  static async getMesNotifications(limit = 50): Promise<Notification[]> {
    const response = await api.get(`/notifications?limit=${limit}`);
    return response.data.data;
  }

  // Marquer comme lues
  static async marquerCommeLu(notificationIds: string[]): Promise<void> {
    await api.put('/notifications/marquer-lu', { notification_ids: notificationIds });
  }

  // Marquer tout comme lu
  static async marquerToutCommeLu(): Promise<void> {
    await api.put('/notifications/marquer-tout-lu');
  }

  // Compter notifications non lues
  static async compterNonLues(): Promise<number> {
    const response = await api.get('/notifications/non-lues/count');
    return response.data.data.count;
  }
}
```
## 👩‍💻 INTERFACES CANDIDAT

### 1. Liste des offres d'emploi
```tsx
// components/candidat/OffresList.tsx
import React, { useState, useEffect } from 'react';
import { OffreService } from '../../services/offreService';
import { FavorisService } from '../../services/favorisService';

const OffresList: React.FC = () => {
  const [offres, setOffres] = useState<OffreEmploi[]>([]);
  const [filtres, setFiltres] = useState({
    titre: '',
    localisation: '',
    type_poste: '',
    accessibilite_handicap: true,
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chargerOffres();
  }, [filtres]);

  const chargerOffres = async () => {
    setLoading(true);
    try {
      const data = await OffreService.getOffres(filtres);
      setOffres(data);
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavori = async (idOffre: string, estFavori: boolean) => {
    try {
      if (estFavori) {
        await FavorisService.retirerFavori(idOffre);
      } else {
        await FavorisService.ajouterFavori(idOffre);
      }
      // Rafraîchir la liste
      chargerOffres();
    } catch (error) {
      console.error('Erreur gestion favoris:', error);
    }
  };

  return (
    <div className="offres-list">
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Rechercher par titre..."
          value={filtres.titre}
          onChange={(e) => setFiltres({...filtres, titre: e.target.value})}
        />
        <input
          type="text"
          placeholder="Localisation..."
          value={filtres.localisation}
          onChange={(e) => setFiltres({...filtres, localisation: e.target.value})}
        />
        <select
          value={filtres.type_poste}
          onChange={(e) => setFiltres({...filtres, type_poste: e.target.value})}
        >
          <option value="">Tous les types</option>
          <option value="cdi">CDI</option>
          <option value="cdd">CDD</option>
          <option value="stage">Stage</option>
          <option value="freelance">Freelance</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={filtres.accessibilite_handicap}
            onChange={(e) => setFiltres({...filtres, accessibilite_handicap: e.target.checked})}
          />
          Accessibilité handicap
        </label>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="offres-grid">
          {offres.map((offre) => (
            <div key={offre.id} className="offre-card">
              <div className="offre-header">
                <h3>{offre.titre}</h3>
                <button
                  className="btn-favori"
                  onClick={() => toggleFavori(offre.id, false)} // À implémenter la vérification
                >
                  ⭐
                </button>
              </div>
              <p className="entreprise">{offre.entreprise.nom}</p>
              <p className="localisation">📍 {offre.localisation}</p>
              <p className="type-poste">{offre.type_poste.toUpperCase()}</p>
              {offre.salaire_min && offre.salaire_max && (
                <p className="salaire">💰 {offre.salaire_min} - {offre.salaire_max}</p>
              )}
              <p className="description">{offre.description.substring(0, 150)}...</p>
              {offre.accessibilite_handicap && (
                <span className="badge-accessibilite">♿ Accessible</span>
              )}
              <div className="offre-actions">
                <button 
                  className="btn-voir-details"
                  onClick={() => window.location.href = `/offres/${offre.id}`}
                >
                  Voir détails
                </button>
                <button 
                  className="btn-postuler"
                  onClick={() => {/* Ouvrir modal candidature */}}
                >
                  Postuler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={filtres.page === 1}
          onClick={() => setFiltres({...filtres, page: filtres.page - 1})}
        >
          Précédent
        </button>
        <span>Page {filtres.page}</span>
        <button 
          onClick={() => setFiltres({...filtres, page: filtres.page + 1})}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default OffresList;
```
### 2. Modal de candidature
```tsx
// components/candidat/PostulerModal.tsx
import React, { useState } from 'react';
import { CandidatureService } from '../../services/candidatureService';

interface PostulerModalProps {
  offre: OffreEmploi;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PostulerModal: React.FC<PostulerModalProps> = ({ offre, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lettre_motivation: '',
    cv_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      await CandidatureService.postuler({
        id_offre: offre.id,
        ...formData
      });
      
      onSuccess();
      onClose();
      // Afficher message de succès
      alert('Candidature envoyée avec succès !');
    } catch (error: any) {
      setErrors([error.response?.data?.message || 'Erreur lors de la candidature']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Postuler à : {offre.titre}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="offre-summary">
            <p><strong>Entreprise :</strong> {offre.entreprise.nom}</p>
            <p><strong>Localisation :</strong> {offre.localisation}</p>
            <p><strong>Type :</strong> {offre.type_poste}</p>
          </div>

          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <p key={index} className="error">{error}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cv_url">URL de votre CV *</label>
              <input
                type="url"
                id="cv_url"
                value={formData.cv_url}
                onChange={(e) => setFormData({...formData, cv_url: e.target.value})}
                placeholder="https://example.com/mon-cv.pdf"
                required
              />
              <small>Lien vers votre CV (Google Drive, Dropbox, etc.)</small>
            </div>

            <div className="form-group">
              <label htmlFor="lettre_motivation">Lettre de motivation</label>
              <textarea
                id="lettre_motivation"
                value={formData.lettre_motivation}
                onChange={(e) => setFormData({...formData, lettre_motivation: e.target.value})}
                placeholder="Expliquez pourquoi vous êtes intéressé par ce poste..."
                rows={6}
              />
            </div>

            <div className="eligibilite-check">
              <h4>Vérification d'éligibilité</h4>
              <div className="check-item">
                ✅ Profil complet
              </div>
              <div className="check-item">
                ✅ Critères d'éligibilité respectés
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Annuler
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Envoi...' : 'Envoyer ma candidature'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostulerModal;
```
### 3. Suivi des candidatures
```tsx
// components/candidat/MesCandidatures.tsx
import React, { useState, useEffect } from 'react';
import { CandidatureService } from '../../services/candidatureService';

const MesCandidatures: React.FC = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerCandidatures();
  }, []);

  const chargerCandidatures = async () => {
    try {
      const data = await CandidatureService.getMesCandidatures();
      setCandidatures(data);
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      pending: { label: 'En attente', class: 'status-pending', icon: '⏳' },
      shortlisted: { label: 'Présélectionné', class: 'status-shortlisted', icon: '⭐' },
      interview_scheduled: { label: 'Entretien planifié', class: 'status-interview', icon: '📅' },
      rejected: { label: 'Refusé', class: 'status-rejected', icon: '❌' },
      accepted: { label: 'Accepté', class: 'status-accepted', icon: '✅' }
    };

    const config = statusConfig[statut] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Chargement de vos candidatures...</div>;
  }

  return (
    <div className="mes-candidatures">
      <div className="page-header">
        <h1>Mes candidatures</h1>
        <p>Suivez l'évolution de vos candidatures</p>
      </div>

      {candidatures.length === 0 ? (
        <div className="empty-state">
          <p>Vous n'avez pas encore postulé à d'offres.</p>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/offres'}
          >
            Découvrir les offres
          </button>
        </div>
      ) : (
        <div className="candidatures-list">
          {candidatures.map((candidature) => (
            <div key={candidature.id} className="candidature-card">
              <div className="candidature-header">
                <div className="offre-info">
                  <h3>{candidature.offre.titre}</h3>
                  <p className="entreprise">{candidature.entreprise.nom}</p>
                  <p className="localisation">📍 {candidature.offre.localisation}</p>
                </div>
                <div className="candidature-status">
                  {getStatusBadge(candidature.statut)}
                </div>
              </div>

              <div className="candidature-details">
                <div className="detail-item">
                  <span className="label">Date de candidature :</span>
                  <span className="value">{formatDate(candidature.date_postulation)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Type de poste :</span>
                  <span className="value">{candidature.offre.type_poste.toUpperCase()}</span>
                </div>
                {candidature.score_test && (
                  <div className="detail-item">
                    <span className="label">Score test :</span>
                    <span className="value">{candidature.score_test}/100</span>
                  </div>
                )}
              </div>

              {candidature.motif_refus && (
                <div className="motif-refus">
                  <strong>Motif de refus :</strong> {candidature.motif_refus}
                </div>
              )}

              {candidature.notes_entreprise && (
                <div className="notes-entreprise">
                  <strong>Notes de l'entreprise :</strong> {candidature.notes_entreprise}
                </div>
              )}

              <div className="candidature-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => window.location.href = `/offres/${candidature.offre.id}`}
                >
                  Voir l'offre
                </button>
                {candidature.statut === 'interview_scheduled' && (
                  <button 
                    className="btn-primary"
                    onClick={() => window.location.href = '/entretiens'}
                  >
                    Voir entretien
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MesCandidatures;
```
### 4. Gestion des entretiens (candidat)
```tsx
// components/candidat/MesEntretiens.tsx
import React, { useState, useEffect } from 'react';
import { EntretienService } from '../../services/entretienService';

const MesEntretiens: React.FC = () => {
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerEntretiens();
  }, []);

  const chargerEntretiens = async () => {
    try {
      const data = await EntretienService.getMesEntretiens();
      setEntretiens(data);
    } catch (error) {
      console.error('Erreur lors du chargement des entretiens:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmerEntretien = async (id: string) => {
    try {
      await EntretienService.confirmerEntretien(id);
      chargerEntretiens(); // Rafraîchir la liste
      alert('Entretien confirmé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      alert('Erreur lors de la confirmation');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      visio: '💻',
      presentiel: '🏢',
      telephonique: '📞'
    };
    return icons[type] || '📅';
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      planifie: { label: 'Planifié', class: 'status-planned', icon: '📅' },
      confirme: { label: 'Confirmé', class: 'status-confirmed', icon: '✅' },
      reporte: { label: 'Reporté', class: 'status-postponed', icon: '⏰' },
      annule: { label: 'Annulé', class: 'status-cancelled', icon: '❌' },
      termine: { label: 'Terminé', class: 'status-completed', icon: '✔️' }
    };

    const config = statusConfig[statut] || statusConfig.planifie;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Chargement de vos entretiens...</div>;
  }

  return (
    <div className="mes-entretiens">
      <div className="page-header">
        <h1>Mes entretiens</h1>
        <p>Gérez vos entretiens programmés</p>
      </div>

      {entretiens.length === 0 ? (
        <div className="empty-state">
          <p>Aucun entretien programmé pour le moment.</p>
        </div>
      ) : (
        <div className="entretiens-list">
          {entretiens.map((entretien) => {
            const dateTime = formatDateTime(entretien.date_heure);
            return (
              <div key={entretien.id} className="entretien-card">
                <div className="entretien-header">
                  <div className="offre-info">
                    <h3>{entretien.offre.titre}</h3>
                    <p className="entreprise">{entretien.entreprise.nom}</p>
                  </div>
                  <div className="entretien-status">
                    {getStatusBadge(entretien.statut)}
                  </div>
                </div>

                <div className="entretien-details">
                  <div className="datetime-info">
                    <div className="date">
                      📅 {dateTime.date}
                    </div>
                    <div className="time">
                      🕐 {dateTime.time}
                    </div>
                  </div>

                  <div className="type-info">
                    <span className="type-badge">
                      {getTypeIcon(entretien.type)} {entretien.type}
                    </span>
                  </div>

                  {entretien.duree_prevue && (
                    <div className="duree">
                      ⏱️ Durée prévue : {entretien.duree_prevue}
                    </div>
                  )}
                </div>

                {entretien.type === 'visio' && entretien.lieu_visio && (
                  <div className="lieu-visio">
                    <strong>Lien de visioconférence :</strong>
                    <a href={entretien.lieu_visio} target="_blank" rel="noopener noreferrer">
                      {entretien.lieu_visio}
                    </a>
                  </div>
                )}

                {entretien.type === 'presentiel' && entretien.lieu && (
                  <div className="lieu-presentiel">
                    <strong>Adresse :</strong> {entretien.lieu}
                  </div>
                )}

                {entretien.contact_entreprise && (
                  <div className="contact-info">
                    <strong>Contact :</strong> {entretien.contact_entreprise}
                  </div>
                )}

                {entretien.notes && (
                  <div className="notes">
                    <strong>Notes :</strong> {entretien.notes}
                  </div>
                )}

                <div className="entretien-actions">
                  {entretien.statut === 'planifie' && (
                    <button 
                      className="btn-primary"
                      onClick={() => confirmerEntretien(entretien.id)}
                    >
                      Confirmer ma présence
                    </button>
                  )}
                  
                  {entretien.entreprise.contact_rh_email && (
                    <a 
                      href={`mailto:${entretien.entreprise.contact_rh_email}`}
                      className="btn-secondary"
                    >
                      Contacter RH
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MesEntretiens;
```
## 🏢 INTERFACES ENTREPRISE

### 1. Gestion des candidatures reçues
```tsx
// components/entreprise/CandidaturesRecues.tsx
import React, { useState, useEffect } from 'react';
import { CandidatureService } from '../../services/candidatureService';
import { EntretienService } from '../../services/entretienService';

const CandidaturesRecues: React.FC = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [filtres, setFiltres] = useState({
    statut: '',
    score_min: '',
    score_max: '',
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [showEntretienModal, setShowEntretienModal] = useState<string | null>(null);

  useEffect(() => {
    chargerCandidatures();
  }, [filtres]);

  const chargerCandidatures = async () => {
    setLoading(true);
    try {
      const data = await CandidatureService.getCandidaturesEntreprise(filtres);
      setCandidatures(data);
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortlisterCandidat = async (candidatureId: string) => {
    try {
      await CandidatureService.shortlister(candidatureId);
      chargerCandidatures();
      alert('Candidat présélectionné avec succès !');
    } catch (error) {
      console.error('Erreur lors de la présélection:', error);
      alert('Erreur lors de la présélection');
    }
  };

  const refuserCandidat = async (candidatureId: string) => {
    const motif = prompt('Motif de refus (optionnel) :');
    try {
      await CandidatureService.refuser(candidatureId, motif || undefined);
      chargerCandidatures();
      alert('Candidature refusée');
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      alert('Erreur lors du refus');
    }
  };

  const accepterCandidat = async (candidatureId: string) => {
    if (confirm('Êtes-vous sûr de vouloir accepter cette candidature ?')) {
      try {
        await CandidatureService.accepter(candidatureId);
        chargerCandidatures();
        alert('Candidature acceptée avec succès !');
      } catch (error) {
        console.error('Erreur lors de l\'acceptation:', error);
        alert('Erreur lors de l\'acceptation');
      }
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  };

  return (
    <div className="candidatures-recues">
      <div className="page-header">
        <h1>Candidatures reçues</h1>
        <p>Gérez les candidatures pour vos offres</p>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <select
          value={filtres.statut}
          onChange={(e) => setFiltres({...filtres, statut: e.target.value})}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="shortlisted">Présélectionnés</option>
          <option value="interview_scheduled">Entretien planifié</option>
          <option value="rejected">Refusés</option>
          <option value="accepted">Acceptés</option>
        </select>

        <input
          type="number"
          placeholder="Score min"
          value={filtres.score_min}
          onChange={(e) => setFiltres({...filtres, score_min: e.target.value})}
        />

        <input
          type="number"
          placeholder="Score max"
          value={filtres.score_max}
          onChange={(e) => setFiltres({...filtres, score_max: e.target.value})}
        />
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="candidatures-grid">
          {candidatures.map((candidature) => (
            <div key={candidature.id} className="candidature-card">
              <div className="candidat-header">
                <div className="candidat-info">
                  <h3>{candidature.candidat?.nom || 'Candidat'}</h3>
                  <p className="offre-titre">{candidature.offre.titre}</p>
                </div>
                <div className="candidature-meta">
                  <span className={`status-badge status-${candidature.statut}`}>
                    {candidature.statut}
                  </span>
                  {candidature.score_test && (
                    <span 
                      className="score-badge"
                      style={{ color: getScoreColor(candidature.score_test) }}
                    >
                      {candidature.score_test}/100
                    </span>
                  )}
                </div>
              </div>

              <div className="candidat-details">
                <div className="detail-row">
                  <span>📅 Candidature :</span>
                  <span>{new Date(candidature.date_postulation).toLocaleDateString()}</span>
                </div>
                
                {candidature.candidat?.competences && (
                  <div className="competences">
                    <strong>Compétences :</strong>
                    <div className="competences-tags">
                      {candidature.candidat.competences.map((comp, index) => (
                        <span key={index} className="competence-tag">{comp}</span>
                      ))}
                    </div>
                  </div>
                )}

                {candidature.candidat?.experience && (
                  <div className="experience">
                    <strong>Expérience :</strong>
                    <p>{candidature.candidat.experience}</p>
                  </div>
                )}

                {candidature.candidat?.handicap && (
                  <div className="handicap-info">
                    <strong>Besoins d'accessibilité :</strong>
                    <p>{candidature.candidat.handicap}</p>
                  </div>
                )}

                {candidature.lettre_motivation && (
                  <div className="lettre-motivation">
                    <strong>Lettre de motivation :</strong>
                    <p>{candidature.lettre_motivation}</p>
                  </div>
                )}
              </div>

              <div className="candidature-actions">
                {candidature.cv_url && (
                  <a 
                    href={candidature.cv_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    📄 Voir CV
                  </a>
                )}

                {candidature.statut === 'pending' && (
                  <>
                    <button 
                      className="btn-success"
                      onClick={() => shortlisterCandidat(candidature.id)}
                    >
                      ⭐ Shortlister
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => refuserCandidat(candidature.id)}
                    >
                      ❌ Refuser
                    </button>
                  </>
                )}

                {candidature.statut === 'shortlisted' && (
                  <>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowEntretienModal(candidature.id)}
                    >
                      📅 Planifier entretien
                    </button>
                    <button 
                      className="btn-success"
                      onClick={() => accepterCandidat(candidature.id)}
                    >
                      ✅ Accepter
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => refuserCandidat(candidature.id)}
                    >
                      ❌ Refuser
                    </button>
                  </>
                )}

                {candidature.statut === 'interview_scheduled' && (
                  <button 
                    className="btn-success"
                    onClick={() => accepterCandidat(candidature.id)}
                  >
                    ✅ Accepter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal planification entretien */}
      {showEntretienModal && (
        <PlanifierEntretienModal
          candidatureId={showEntretienModal}
          onClose={() => setShowEntretienModal(null)}
          onSuccess={() => {
            setShowEntretienModal(null);
            chargerCandidatures();
          }}
        />
      )}
    </div>
  );
};

export default CandidaturesRecues;
```
### 2. Modal de planification d'entretien
```tsx
// components/entreprise/PlanifierEntretienModal.tsx
import React, { useState } from 'react';
import { EntretienService } from '../../services/entretienService';

interface PlanifierEntretienModalProps {
  candidatureId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PlanifierEntretienModal: React.FC<PlanifierEntretienModalProps> = ({
  candidatureId,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    date_heure: '',
    type: 'visio' as 'visio' | 'presentiel' | 'telephonique',
    lieu_visio: '',
    lieu: '',
    duree_prevue: '1 heure',
    contact_entreprise: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      await EntretienService.planifierEntretien({
        id_candidature: candidatureId,
        ...formData
      });
      
      onSuccess();
      alert('Entretien planifié avec succès !');
    } catch (error: any) {
      setErrors([error.response?.data?.message || 'Erreur lors de la planification']);
    } finally {
      setLoading(false);
    }
  };

  // Générer les créneaux disponibles (exemple simple)
  const generateTimeSlots = () => {
    const slots = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) { // 2 semaines
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Éviter les weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        for (let hour = 9; hour <= 17; hour++) {
          const datetime = new Date(date);
          datetime.setHours(hour, 0, 0, 0);
          slots.push(datetime);
        }
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>Planifier un entretien</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <p key={index} className="error">{error}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date_heure">Date et heure *</label>
                <select
                  id="date_heure"
                  value={formData.date_heure}
                  onChange={(e) => setFormData({...formData, date_heure: e.target.value})}
                  required
                >
                  <option value="">Choisir un créneau</option>
                  {timeSlots.map((slot, index) => (
                    <option key={index} value={slot.toISOString()}>
                      {slot.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })} à {slot.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="duree_prevue">Durée prévue</label>
                <select
                  id="duree_prevue"
                  value={formData.duree_prevue}
                  onChange={(e) => setFormData({...formData, duree_prevue: e.target.value})}
                >
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="1 heure">1 heure</option>
                  <option value="1h30">1h30</option>
                  <option value="2 heures">2 heures</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Type d'entretien *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="visio"
                    checked={formData.type === 'visio'}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  />
                  💻 Visioconférence
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="presentiel"
                    checked={formData.type === 'presentiel'}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  />
                  🏢 Présentiel
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="telephonique"
                    checked={formData.type === 'telephonique'}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  />
                  📞 Téléphonique
                </label>
              </div>
            </div>

            {formData.type === 'visio' && (
              <div className="form-group">
                <label htmlFor="lieu_visio">Lien de visioconférence *</label>
                <input
                  type="url"
                  id="lieu_visio"
                  value={formData.lieu_visio}
                  onChange={(e) => setFormData({...formData, lieu_visio: e.target.value})}
                  placeholder="https://meet.google.com/abc-def-ghi"
                  required
                />
                <small>Google Meet, Zoom, Teams, etc.</small>
              </div>
            )}

            {formData.type === 'presentiel' && (
              <div className="form-group">
                <label htmlFor="lieu">Adresse *</label>
                <textarea
                  id="lieu"
                  value={formData.lieu}
                  onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                  placeholder="Adresse complète de l'entretien"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="contact_entreprise">Contact entreprise</label>
              <input
                type="email"
                id="contact_entreprise"
                value={formData.contact_entreprise}
                onChange={(e) => setFormData({...formData, contact_entreprise: e.target.value})}
                placeholder="email@entreprise.com"
              />
              <small>Email de contact pour le candidat</small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes / Instructions</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Instructions particulières, documents à apporter, etc."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Annuler
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Planification...' : 'Planifier l\'entretien'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlanifierEntretienModal;
```
### 3. Création d'offre d'emploi
```tsx
// components/entreprise/CreerOffre.tsx
import React, { useState } from 'react';
import { OffreService } from '../../services/offreService';

const CreerOffre: React.FC = () => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    localisation: '',
    type_poste: 'cdi' as const,
    salaire_min: '',
    salaire_max: '',
    competences_requises: '',
    experience_requise: '',
    niveau_etude: '',
    date_limite: '',
    accessibilite_handicap: true,
    amenagements_possibles: '',
    criteres_eligibilite: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      await OffreService.creerOffre(formData);
      alert('Offre créée avec succès !');
      // Rediriger vers la liste des offres
      window.location.href = '/entreprise/mes-offres';
    } catch (error: any) {
      setErrors([error.response?.data?.message || 'Erreur lors de la création']);
    } finally {
      setLoading(false);
    }
  };

  const ajouterCritere = () => {
    setFormData({
      ...formData,
      criteres_eligibilite: [
        ...formData.criteres_eligibilite,
        {
          description: '',
          type_critere: 'competence',
          valeur_requise: '',
          obligatoire: true
        }
      ]
    });
  };

  const supprimerCritere = (index: number) => {
    const nouveauxCriteres = formData.criteres_eligibilite.filter((_, i) => i !== index);
    setFormData({ ...formData, criteres_eligibilite: nouveauxCriteres });
  };

  const modifierCritere = (index: number, champ: string, valeur: any) => {
    const nouveauxCriteres = [...formData.criteres_eligibilite];
    nouveauxCriteres[index] = { ...nouveauxCriteres[index], [champ]: valeur };
    setFormData({ ...formData, criteres_eligibilite: nouveauxCriteres });
  };

  return (
    <div className="creer-offre">
      <div className="page-header">
        <h1>Créer une offre d'emploi</h1>
        <p>Publiez votre offre pour attirer les meilleurs candidats</p>
      </div>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, index) => (
            <p key={index} className="error">{error}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="offre-form">
        <div className="form-section">
          <h3>Informations générales</h3>
          
          <div className="form-group">
            <label htmlFor="titre">Titre du poste *</label>
            <input
              type="text"
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({...formData, titre: e.target.value})}
              placeholder="Ex: Développeur Full Stack"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description du poste *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Décrivez le poste, les missions, l'environnement de travail..."
              rows={6}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="localisation">Localisation *</label>
              <input
                type="text"
                id="localisation"
                value={formData.localisation}
                onChange={(e) => setFormData({...formData, localisation: e.target.value})}
                placeholder="Ex: Paris, Télétravail, Hybride"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type_poste">Type de contrat *</label>
              <select
                id="type_poste"
                value={formData.type_poste}
                onChange={(e) => setFormData({...formData, type_poste: e.target.value as any})}
                required
              >
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="stage">Stage</option>
                <option value="freelance">Freelance</option>
                <option value="temps_partiel">Temps partiel</option>
                <option value="temps_plein">Temps plein</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="salaire_min">Salaire minimum (€)</label>
              <input
                type="text"
                id="salaire_min"
                value={formData.salaire_min}
                onChange={(e) => setFormData({...formData, salaire_min: e.target.value})}
                placeholder="Ex: 35000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="salaire_max">Salaire maximum (€)</label>
              <input
                type="text"
                id="salaire_max"
                value={formData.salaire_max}
                onChange={(e) => setFormData({...formData, salaire_max: e.target.value})}
                placeholder="Ex: 45000"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_limite">Date limite de candidature</label>
            <input
              type="date"
              id="date_limite"
              value={formData.date_limite}
              onChange={(e) => setFormData({...formData, date_limite: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Exigences du poste</h3>
          
          <div className="form-group">
            <label htmlFor="competences_requises">Compétences requises</label>
            <textarea
              id="competences_requises"
              value={formData.competences_requises}
              onChange={(e) => setFormData({...formData, competences_requises: e.target.value})}
              placeholder="Ex: JavaScript, React, Node.js, SQL..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experience_requise">Expérience requise</label>
              <input
                type="text"
                id="experience_requise"
                value={formData.experience_requise}
                onChange={(e) => setFormData({...formData, experience_requise: e.target.value})}
                placeholder="Ex: 2-5 ans"
              />
            </div>

            <div className="form-group">
              <label htmlFor="niveau_etude">Niveau d'étude</label>
              <select
                id="niveau_etude"
                value={formData.niveau_etude}
                onChange={(e) => setFormData({...formData, niveau_etude: e.target.value})}
              >
                <option value="">Non spécifié</option>
                <option value="Bac">Bac</option>
                <option value="Bac+2">Bac+2</option>
                <option value="Bac+3">Bac+3</option>
                <option value="Bac+5">Bac+5</option>
                <option value="Doctorat">Doctorat</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Accessibilité et inclusion</h3>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.accessibilite_handicap}
                onChange={(e) => setFormData({...formData, accessibilite_handicap: e.target.checked})}
              />
              Ce poste est accessible aux personnes en situation de handicap
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="amenagements_possibles">Aménagements possibles</label>
            <textarea
              id="amenagements_possibles"
              value={formData.amenagements_possibles}
              onChange={(e) => setFormData({...formData, amenagements_possibles: e.target.value})}
              placeholder="Ex: Télétravail partiel, aménagement de poste, horaires flexibles..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Critères d'éligibilité</h3>
          <p className="section-description">
            Définissez des critères spécifiques pour filtrer automatiquement les candidatures
          </p>
          
          {formData.criteres_eligibilite.map((critere, index) => (
            <div key={index} className="critere-item">
              <div className="form-row">
                <div className="form-group">
                  <select
                    value={critere.type_critere}
                    onChange={(e) => modifierCritere(index, 'type_critere', e.target.value)}
                  >
                    <option value="competence">Compétence</option>
                    <option value="experience">Expérience</option>
                    <option value="formation">Formation</option>
                    <option value="handicap">Handicap</option>
                  </select>
                </div>
                
                <div className="form-group flex-grow">
                  <input
                    type="text"
                    value={critere.description}
                    onChange={(e) => modifierCritere(index, 'description', e.target.value)}
                    placeholder="Description du critère"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={critere.obligatoire}
                      onChange={(e) => modifierCritere(index, 'obligatoire', e.target.checked)}
                    />
                    Obligatoire
                  </label>
                </div>

                <button
                  type="button"
                  className="btn-danger btn-small"
                  onClick={() => supprimerCritere(index)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            onClick={ajouterCritere}
          >
            + Ajouter un critère
          </button>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Publier l\'offre'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreerOffre;
```
## 🛡️ INTERFACES ADMIN

### 1. Supervision des candidatures
```tsx
// components/admin/SupervisionCandidatures.tsx
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';

const SupervisionCandidatures: React.FC = () => {
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [statistiques, setStatistiques] = useState<any>(null);
  const [filtres, setFiltres] = useState({
    page: 1,
    limit: 20
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, [filtres]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [candidaturesData, statsData] = await Promise.all([
        AdminService.getToutesCandidatures(filtres),
        AdminService.getStatistiquesGlobales()
      ]);
      setCandidatures(candidaturesData);
      setStatistiques(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const modifierStatut = async (candidatureId: string, nouveauStatut: string) => {
    const motif = prompt('Motif de la modification (optionnel) :');
    try {
      await AdminService.modifierStatutAdmin(candidatureId, nouveauStatut, motif);
      chargerDonnees();
      alert('Statut modifié avec succès');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification');
    }
  };

  const bloquerCandidature = async (candidatureId: string) => {
    const motif = prompt('Motif du blocage :');
    if (!motif) return;

    try {
      await AdminService.bloquerCandidature(candidatureId, motif);
      chargerDonnees();
      alert('Candidature bloquée');
    } catch (error) {
      console.error('Erreur lors du blocage:', error);
      alert('Erreur lors du blocage');
    }
  };

  return (
    <div className="supervision-candidatures">
      <div className="page-header">
        <h1>Supervision des candidatures</h1>
        <p>Vue d'ensemble et contrôle de toutes les candidatures</p>
      </div>

      {/* Statistiques globales */}
      {statistiques && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total candidatures</h3>
            <div className="stat-value">{statistiques.total_candidatures}</div>
          </div>
          <div className="stat-card">
            <h3>Taux de recrutement</h3>
            <div className="stat-value">{statistiques.taux_recrutement}%</div>
          </div>
          <div className="stat-card">
            <h3>Temps moyen</h3>
            <div className="stat-value">{statistiques.temps_moyen_traitement_jours} jours</div>
          </div>
        </div>
      )}

      {/* Répartition par statut */}
      {statistiques?.stats_par_statut && (
        <div className="status-distribution">
          <h3>Répartition par statut</h3>
          <div className="status-bars">
            {statistiques.stats_par_statut.map((stat: any) => (
              <div key={stat.statut} className="status-bar">
                <span className="status-label">{stat.statut}</span>
                <div className="bar-container">
                  <div 
                    className={`bar bar-${stat.statut}`}
                    style={{ 
                      width: `${(stat.count / statistiques.total_candidatures) * 100}%` 
                    }}
                  />
                </div>
                <span className="status-count">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des candidatures */}
      <div className="candidatures-section">
        <h3>Toutes les candidatures</h3>
        
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : (
          <div className="candidatures-table">
            <table>
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Offre</th>
                  <th>Entreprise</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidatures.map((candidature) => (
                  <tr key={candidature.id}>
                    <td>
                      <div className="candidat-info">
                        <strong>{candidature.candidat?.nom}</strong>
                        <small>{candidature.candidat?.email}</small>
                      </div>
                    </td>
                    <td>{candidature.offre?.titre}</td>
                    <td>{candidature.entreprise?.nom}</td>
                    <td>
                      {new Date(candidature.date_postulation).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge status-${candidature.statut}`}>
                        {candidature.statut}
                      </span>
                    </td>
                    <td>
                      {candidature.score_test ? `${candidature.score_test}/100` : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              modifierStatut(candidature.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">Changer statut</option>
                          <option value="pending">En attente</option>
                          <option value="shortlisted">Shortlisté</option>
                          <option value="interview_scheduled">Entretien</option>
                          <option value="accepted">Accepté</option>
                          <option value="rejected">Refusé</option>
                        </select>
                        
                        <button
                          className="btn-danger btn-small"
                          onClick={() => bloquerCandidature(candidature.id)}
                        >
                          Bloquer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button 
            disabled={filtres.page === 1}
            onClick={() => setFiltres({...filtres, page: filtres.page - 1})}
          >
            Précédent
          </button>
          <span>Page {filtres.page}</span>
          <button 
            onClick={() => setFiltres({...filtres, page: filtres.page + 1})}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisionCandidatures;
```
### 2. Détection d'abus
```tsx
// components/admin/DetectionAbus.tsx
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';

const DetectionAbus: React.FC = () => {
  const [abus, setAbus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerDetectionAbus();
  }, []);

  const chargerDetectionAbus = async () => {
    try {
      const data = await AdminService.detecterAbus();
      setAbus(data);
    } catch (error) {
      console.error('Erreur lors de la détection d\'abus:', error);
    } finally {
      setLoading(false);
    }
  };

  const desactiverUtilisateur = async (userId: string, type: 'candidat' | 'entreprise') => {
    if (confirm(`Êtes-vous sûr de vouloir désactiver ce ${type} ?`)) {
      try {
        await AdminService.desactiverUtilisateur(userId);
        alert(`${type} désactivé avec succès`);
        chargerDetectionAbus();
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        alert('Erreur lors de la désactivation');
      }
    }
  };

  if (loading) {
    return <div className="loading">Analyse en cours...</div>;
  }

  return (
    <div className="detection-abus">
      <div className="page-header">
        <h1>Détection d'abus</h1>
        <p>Surveillance automatique des comportements suspects</p>
      </div>

      {/* Candidats hyperactifs */}
      <div className="abus-section">
        <h3>🚨 Candidats hyperactifs</h3>
        <p className="section-description">
          Candidats avec plus de 20 candidatures en 7 jours
        </p>
        
        {abus?.candidats_hyperactifs?.length === 0 ? (
          <div className="no-issues">
            ✅ Aucun candidat suspect détecté
          </div>
        ) : (
          <div className="abus-table">
            <table>
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Email</th>
                  <th>Candidatures (7j)</th>
                  <th>Dernière candidature</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {abus?.candidats_hyperactifs?.map((candidat: any) => (
                  <tr key={candidat.candidat_id} className="suspect-row">
                    <td>
                      <strong>{candidat.candidat_nom}</strong>
                    </td>
                    <td>{candidat.candidat_email}</td>
                    <td>
                      <span className="danger-badge">
                        {candidat.nombre_candidatures}
                      </span>
                    </td>
                    <td>
                      {new Date(candidat.derniere_candidature).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-warning btn-small"
                          onClick={() => {
                            // Ouvrir modal de détails
                            alert('Fonctionnalité à implémenter : voir détails');
                          }}
                        >
                          Détails
                        </button>
                        <button
                          className="btn-danger btn-small"
                          onClick={() => desactiverUtilisateur(candidat.candidat_id, 'candidat')}
                        >
                          Désactiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entreprises suspectes */}
      <div className="abus-section">
        <h3>⚠️ Entreprises avec taux de refus élevé</h3>
        <p className="section-description">
          Entreprises avec plus de 90% de refus sur 10+ candidatures
        </p>
        
        {abus?.entreprises_taux_refus_eleve?.length === 0 ? (
          <div className="no-issues">
            ✅ Aucune entreprise suspecte détectée
          </div>
        ) : (
          <div className="abus-table">
            <table>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Total candidatures</th>
                  <th>Candidatures refusées</th>
                  <th>Taux de refus</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {abus?.entreprises_taux_refus_eleve?.map((entreprise: any) => (
                  <tr key={entreprise.entreprise_id} className="suspect-row">
                    <td>
                      <strong>{entreprise.entreprise_nom}</strong>
                    </td>
                    <td>{entreprise.total_candidatures}</td>
                    <td>{entreprise.candidatures_refusees}</td>
                    <td>
                      <span className="danger-badge">
                        {Math.round(entreprise.taux_refus)}%
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-warning btn-small"
                          onClick={() => {
                            // Ouvrir modal de détails
                            alert('Fonctionnalité à implémenter : voir détails');
                          }}
                        >
                          Analyser
                        </button>
                        <button
                          className="btn-danger btn-small"
                          onClick={() => desactiverUtilisateur(entreprise.entreprise_id, 'entreprise')}
                        >
                          Désactiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommandations */}
      <div className="recommendations">
        <h3>💡 Recommandations</h3>
        <div className="recommendation-cards">
          <div className="recommendation-card">
            <h4>Candidats hyperactifs</h4>
            <ul>
              <li>Vérifier la qualité des candidatures</li>
              <li>Contacter le candidat pour comprendre sa démarche</li>
              <li>Limiter temporairement les candidatures si nécessaire</li>
            </ul>
          </div>
          
          <div className="recommendation-card">
            <h4>Entreprises avec taux de refus élevé</h4>
            <ul>
              <li>Analyser les motifs de refus</li>
              <li>Vérifier la pertinence des offres publiées</li>
              <li>Proposer un accompagnement RH</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions globales */}
      <div className="global-actions">
        <button 
          className="btn-primary"
          onClick={chargerDetectionAbus}
        >
          🔄 Actualiser l'analyse
        </button>
        
        <button 
          className="btn-secondary"
          onClick={() => {
            // Exporter rapport
            alert('Fonctionnalité à implémenter : export rapport');
          }}
        >
          📊 Exporter le rapport
        </button>
      </div>
    </div>
  );
};

export default DetectionAbus;
```
## 🎨 STYLES CSS RECOMMANDÉS

### Variables CSS globales
```css
/* styles/variables.css */
:root {
  /* Couleurs principales */
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  
  /* Couleurs de statut */
  --status-pending: #f59e0b;
  --status-shortlisted: #8b5cf6;
  --status-interview: #06b6d4;
  --status-accepted: #10b981;
  --status-rejected: #ef4444;
  
  /* Couleurs de fond */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  /* Couleurs de texte */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Bordures */
  --border-color: #e2e8f0;
  --border-radius: 8px;
  --border-radius-lg: 12px;
  
  /* Ombres */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Espacements */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}
```

### Composants de base
```css
/* styles/components.css */

/* Boutons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
}

/* Cards */
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.offre-card, .candidature-card, .entretien-card {
  @extend .card;
  margin-bottom: var(--spacing-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.offre-card:hover, .candidature-card:hover, .entretien-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-shortlisted {
  background-color: #ede9fe;
  color: #7c3aed;
}

.status-interview {
  background-color: #cffafe;
  color: #0891b2;
}

.status-accepted {
  background-color: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Formulaires */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-lg);
}

/* Tables */
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table th,
.table td {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  background-color: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
}

.table tr:hover {
  background-color: var(--bg-secondary);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

/* Loading states */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

/* Empty states */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

/* Error messages */
.error-messages {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.error {
  color: #991b1b;
  margin: 0;
}

/* Success messages */
.success-message {
  background-color: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  color: #065f46;
}
```
## 🔄 GESTION D'ÉTAT (OPTIONNEL)

### Context API pour les notifications
```tsx
// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationService } from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        NotificationService.getMesNotifications(),
        NotificationService.compterNonLues()
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const markAsRead = async (ids: string[]) => {
    try {
      await NotificationService.marquerCommeLu(ids);
      refreshNotifications();
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.marquerToutCommeLu();
      refreshNotifications();
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  useEffect(() => {
    refreshNotifications();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
```

## 🚀 ROUTING ET NAVIGATION

### Configuration des routes
```tsx
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';

// Composants candidat
import OffresList from './components/candidat/OffresList';
import OffreDetail from './components/candidat/OffreDetail';
import MesCandidatures from './components/candidat/MesCandidatures';
import MesEntretiens from './components/candidat/MesEntretiens';
import MesFavoris from './components/candidat/MesFavoris';

// Composants entreprise
import CreerOffre from './components/entreprise/CreerOffre';
import MesOffres from './components/entreprise/MesOffres';
import CandidaturesRecues from './components/entreprise/CandidaturesRecues';
import GestionEntretiens from './components/entreprise/GestionEntretiens';

// Composants admin
import SupervisionCandidatures from './components/admin/SupervisionCandidatures';
import DetectionAbus from './components/admin/DetectionAbus';

// Composants partagés
import Layout from './components/shared/Layout';
import ProtectedRoute from './components/shared/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <NotificationProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/offres" element={<OffresList />} />
          <Route path="/offres/:id" element={<OffreDetail />} />
          
          {/* Routes candidat */}
          <Route path="/candidat" element={
            <ProtectedRoute role="candidat">
              <Layout userType="candidat">
                <Routes>
                  <Route path="/" element={<Navigate to="/candidat/candidatures" />} />
                  <Route path="/candidatures" element={<MesCandidatures />} />
                  <Route path="/entretiens" element={<MesEntretiens />} />
                  <Route path="/favoris" element={<MesFavoris />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Routes entreprise */}
          <Route path="/entreprise" element={
            <ProtectedRoute role="entreprise">
              <Layout userType="entreprise">
                <Routes>
                  <Route path="/" element={<Navigate to="/entreprise/candidatures" />} />
                  <Route path="/offres/creer" element={<CreerOffre />} />
                  <Route path="/offres" element={<MesOffres />} />
                  <Route path="/candidatures" element={<CandidaturesRecues />} />
                  <Route path="/entretiens" element={<GestionEntretiens />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Routes admin */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <Layout userType="admin">
                <Routes>
                  <Route path="/" element={<Navigate to="/admin/candidatures" />} />
                  <Route path="/candidatures" element={<SupervisionCandidatures />} />
                  <Route path="/abus" element={<DetectionAbus />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/offres" />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
};

export default App;
```

## 📱 RESPONSIVE DESIGN

### Breakpoints recommandés
```css
/* styles/responsive.css */

/* Mobile first approach */
@media (min-width: 640px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .offres-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .modal-content {
    width: 80%;
  }
}

@media (min-width: 1024px) {
  .offres-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .candidatures-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .offres-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Mobile specific styles */
@media (max-width: 639px) {
  .modal-content {
    width: 95%;
    margin: var(--spacing-md);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .table {
    font-size: 0.875rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}
```

## 🔧 UTILITAIRES ET HELPERS

### Utilitaires de date
```typescript
// utils/dateUtils.ts
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${formatDate(dateString)} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Il y a moins d\'une heure';
  if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  
  return formatDate(dateString);
};
```

### Utilitaires de statut
```typescript
// utils/statusUtils.ts
export const getStatusConfig = (statut: string) => {
  const configs = {
    pending: { 
      label: 'En attente', 
      class: 'status-pending', 
      icon: '⏳',
      color: '#f59e0b'
    },
    shortlisted: { 
      label: 'Présélectionné', 
      class: 'status-shortlisted', 
      icon: '⭐',
      color: '#8b5cf6'
    },
    interview_scheduled: { 
      label: 'Entretien planifié', 
      class: 'status-interview', 
      icon: '📅',
      color: '#06b6d4'
    },
    rejected: { 
      label: 'Refusé', 
      class: 'status-rejected', 
      icon: '❌',
      color: '#ef4444'
    },
    accepted: { 
      label: 'Accepté', 
      class: 'status-accepted', 
      icon: '✅',
      color: '#10b981'
    }
  };
  
  return configs[statut] || configs.pending;
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // Vert
  if (score >= 60) return '#f59e0b'; // Orange
  return '#ef4444'; // Rouge
};
```

## 📋 CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Configuration de base
- [ ] Configuration de l'API et authentification
- [ ] Types TypeScript
- [ ] Services de base (offres, candidatures)
- [ ] Routing et navigation
- [ ] Layout et composants partagés

### Phase 2 : Interfaces candidat
- [ ] Liste des offres avec filtres
- [ ] Détail d'offre et modal de candidature
- [ ] Suivi des candidatures
- [ ] Gestion des entretiens
- [ ] Système de favoris
- [ ] Notifications

### Phase 3 : Interfaces entreprise
- [ ] Création et gestion d'offres
- [ ] Visualisation des candidatures
- [ ] Système de filtrage avancé
- [ ] Planification d'entretiens
- [ ] Statistiques RH

### Phase 4 : Interfaces admin
- [ ] Supervision globale
- [ ] Détection d'abus
- [ ] Statistiques et reporting
- [ ] Outils de modération

### Phase 5 : Optimisations
- [ ] Responsive design
- [ ] Performance et lazy loading
- [ ] Tests unitaires
- [ ] Accessibilité
- [ ] SEO et métadonnées

---

**🎯 Cette documentation fournit tout le nécessaire pour implémenter le frontend complet du processus de candidature HandiTalents, en parfaite cohérence avec les APIs développées.**