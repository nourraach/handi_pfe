import { TestEntretienRepository } from "../repositories/test-entretien.repository";
import { ErreurApi } from "../utils/erreur-api";

export class TestEntretienService {
  constructor(private readonly repo = new TestEntretienRepository()) {}

  async creerTest(id_offre: string, titre: string, questions: any[]) {
    if (!id_offre || !titre || !questions?.length) {
      throw new ErreurApi("Champs requis manquants", 400);
    }
    return this.repo.creerTest(id_offre, titre, questions);
  }

  async listerTestsEntreprise(id_offre?: string) {
    return this.repo.listerTests(id_offre);
  }

  async listerTestsCandidat() {
    return this.repo.listerTests();
  }

  async obtenirTest(id: string) {
    const test = await this.repo.obtenirTestComplet(id);
    if (!test) throw new ErreurApi("Test introuvable", 404);
    return test;
  }

  async passerTest(id_test: string, id_candidat: string, reponses: any[]) {
    const test = await this.repo.obtenirTestComplet(id_test);
    if (!test) throw new ErreurApi("Test introuvable", 404);
    return this.repo.enregistrerResultat(id_test, id_candidat, reponses, undefined);
  }

  async resultatsPourEntreprise(id_test: string) {
    return this.repo.resultatsPourTest(id_test);
  }
}
