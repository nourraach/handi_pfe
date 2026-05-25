// @ts-nocheck
import { FavorisRepository } from "../repositories/favoris.repository";
import { OffreEmploiRepository } from "../repositories/offre-emploi.repository";
import { ErreurApi } from "../utils/erreur-api";

export class FavorisService {
  private favorisRepository = new FavorisRepository();
  private offreRepository = new OffreEmploiRepository();

  async ajouterFavori(idCandidat: string | number, idOffre: string | number) {
    try {
      const offre = await this.offreRepository.obtenirOffreParId(String(idOffre));
      if (!offre) {
        throw new ErreurApi(404, "Offre d'emploi non trouvée");
      }
      return await this.favorisRepository.ajouterFavori(String(idCandidat), String(idOffre));
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de l'ajout aux favoris: ${error.message}`);
    }
  }

  async retirerFavori(idCandidat: string | number, idOffre: string | number) {
    try {
      await this.favorisRepository.retirerFavori(String(idCandidat), String(idOffre));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la suppression des favoris: ${error.message}`);
    }
  }

  async obtenirFavorisCandidat(idCandidat: string | number) {
    try {
      const rows: any[] = await this.favorisRepository.obtenirFavorisCandidat(String(idCandidat));
      return rows.map((r) => ({
        id: r.favori.id,
        id_offre: r.favori.id_offre,
        created_at: r.favori.created_at,
        titre: r.offre?.titre,
        nom_entreprise: r.entreprise?.nom,
      }));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la récupération des favoris: ${error.message}`);
    }
  }

  async verifierFavori(idCandidat: string | number, idOffre: string | number) {
    try {
      return await this.favorisRepository.verifierFavori(String(idCandidat), String(idOffre));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la vérification des favoris: ${error.message}`);
    }
  }
}
// @ts-nocheck
