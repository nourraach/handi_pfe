import "dotenv/config";
import * as bcrypt from "bcrypt";
import { db } from "../src/db";
import { utilisateurTable } from "../src/db/schema";
import { RoleUtilisateur, StatutUtilisateur, GenreUtilisateur } from "../src/types/enums";

const args = process.argv.slice(2);
const getArg = (key: string, def?: string) => {
  const idx = args.findIndex((a) => a === key);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return def;
};

async function creerAdmin() {
  try {
    const email = getArg("--email", "admin@handitalents.com");
    const motDePasse = getArg("--mdp", "Admin123!");
    const nom = getArg("--nom", "Administrateur");
    const telephone = getArg("--tel", "00000000");
    const addresse = getArg("--addr", "Tunis");

    const mdpHashe = await bcrypt.hash(motDePasse, 10);

    await db.insert(utilisateurTable).values({
      nom,
      email,
      mdp: mdpHashe,
      telephone,
      addresse,
      role: RoleUtilisateur.ADMIN,
      statut: StatutUtilisateur.ACTIF,
      genre: GenreUtilisateur.HOMME,
    });

    console.log("✅ Administrateur créé avec succès !");
    console.log("📧 Email:", email);
    console.log("🔑 Mot de passe:", motDePasse);
    console.log("⚠️  Pensez à le changer après connexion.");

    process.exit(0);
  } catch (erreur: any) {
    if (erreur.code === "23505") {
      console.error("❌ Un utilisateur avec cet email existe déjà.");
    } else {
      console.error("❌ Erreur lors de la création de l'admin:", erreur.message);
    }
    process.exit(1);
  }
}

creerAdmin();
