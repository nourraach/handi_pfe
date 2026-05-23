import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();

    if (!payload?.candidat || !payload?.fichier_cv || typeof payload?.label === "undefined") {
      return NextResponse.json(
        { error: "Payload feedback incomplet" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Feedback recu",
      feedback: payload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur lors de l enregistrement du feedback",
        detail: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
