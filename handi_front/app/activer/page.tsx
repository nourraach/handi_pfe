import Link from "next/link";
import { BlocActivation } from "@/components/bloc-activation";

export default async function ActiverPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? null;

  return (
    <main className="page-centree section-page">
      <header className="entete-page">
        <div>
          <p className="badge">Connexion</p>
          <h1 style={{ margin: 0 }}>Activation email desactivee</h1>
          <p className="texte-secondaire">
            Vous pouvez vous connecter directement. L'activation par lien email n'est plus necessaire.
          </p>
        </div>
        <Link className="bouton-secondaire" href="/connexion">
          Aller a la connexion
        </Link>
      </header>
      <div className="carte bloc-principal">
        <BlocActivation token={token} />
      </div>
    </main>
  );
}
