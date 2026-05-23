// Utilitaires d'authentification
export interface UtilisateurConnecte {
  id_utilisateur: string;
  nom: string;
  email: string;
  role: 'admin' | 'candidat' | 'entreprise' | 'inspecteur' | 'aneti';
  statut?: string;
  candidat?: { id?: string };
  entreprise?: { id?: string };
}

export interface TokenPayload {
  id_utilisateur: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Récupère le token d'authentification depuis localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token_auth');
  return token && token !== 'null' ? token : null;
}

/**
 * Récupère les données de l'utilisateur connecté
 */
export function getUtilisateurConnecte(): UtilisateurConnecte | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('utilisateur_connecte');
    if (!userData || userData === 'null') return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Erreur parsing utilisateur connecté:', error);
    return null;
  }
}

/**
 * Vérifie si le token est expiré
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload: TokenPayload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp ? payload.exp <= now : true;
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return true;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié avec un token valide
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const utilisateur = getUtilisateurConnecte();
  
  if (!token || !utilisateur) {
    return false;
  }
  
  if (isTokenExpired(token)) {
    console.warn('Token expiré, nettoyage automatique');
    clearAuth();
    return false;
  }
  
  return true;
}

/**
 * Nettoie les données d'authentification
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token_auth');
  localStorage.removeItem('utilisateur_connecte');
}

/**
 * Crée les headers d'authentification pour les requêtes API
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Effectue une requête API authentifiée avec gestion automatique des erreurs
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Vérifier l'authentification avant la requête
  if (!isAuthenticated()) {
    throw new Error('Non authentifié - Veuillez vous reconnecter');
  }
  
  // Ajouter les headers d'authentification
  const baseHeaders = getAuthHeaders();
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (isFormDataBody) {
    delete baseHeaders["Content-Type"];
  }

  const headers = {
    ...baseHeaders,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Gestion automatique des erreurs d'authentification
  if (response.status === 401) {
    console.error('Token invalide ou expiré, nettoyage automatique');
    clearAuth();
    throw new Error('Session expirée - Veuillez vous reconnecter');
  }
  
  if (response.status === 403) {
    throw new Error('Accès interdit - Permissions insuffisantes');
  }
  
  return response;
}

/**
 * Vérifie le rôle de l'utilisateur connecté
 */
export function hasRole(requiredRole: string): boolean {
  const utilisateur = getUtilisateurConnecte();
  return utilisateur?.role === requiredRole;
}

/**
 * Redirige vers la page de connexion si non authentifié
 */
export function requireAuth(requiredRole?: string): boolean {
  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/connexion';
    }
    return false;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    console.error(`Rôle requis: ${requiredRole}, rôle actuel: ${getUtilisateurConnecte()?.role}`);
    return false;
  }
  
  return true;
}
