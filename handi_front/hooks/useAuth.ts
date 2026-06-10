"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth, persistAuth } from '@/lib/auth-utils';
import { UtilisateurConnecte } from '@/types/api';

export function useAuth() {
  const [utilisateur, setUtilisateur] = useState<UtilisateurConnecte | null>(null);
  const [chargement, setChargement] = useState(true);
  const [estConnecte, setEstConnecte] = useState(false);
  const router = useRouter();

  useEffect(() => {
    verifierAuthentification();
  }, []);

  const verifierAuthentification = () => {
    try {
      const token = localStorage.getItem('token_auth');
      const utilisateurData = localStorage.getItem('utilisateur_connecte');

      if (token && utilisateurData) {
        const utilisateurParse = JSON.parse(utilisateurData);
        setUtilisateur(utilisateurParse);
        setEstConnecte(true);
      } else {
        setUtilisateur(null);
        setEstConnecte(false);
        // Ne pas rediriger automatiquement ici pour éviter les boucles
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setUtilisateur(null);
      setEstConnecte(false);
      // Nettoyer le localStorage en cas d'erreur
      clearAuth();
    } finally {
      setChargement(false);
    }
  };

  const connexion = (token: string, utilisateurData: UtilisateurConnecte) => {
    persistAuth(token, utilisateurData);
    setUtilisateur(utilisateurData);
    setEstConnecte(true);
  };

  const deconnexion = () => {
    clearAuth();
    setUtilisateur(null);
    setEstConnecte(false);
    router.push('/');
  };

  const estAdmin = () => utilisateur?.role === 'admin';
  const estCandidat = () => utilisateur?.role === 'candidat';
  const estEntreprise = () => utilisateur?.role === 'entreprise';

  return {
    utilisateur,
    chargement,
    estConnecte,
    connexion,
    deconnexion,
    verifierAuthentification,
    estAdmin,
    estCandidat,
    estEntreprise
  };
}
