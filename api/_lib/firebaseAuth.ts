import { createRemoteJWKSet, jwtVerify } from "jose";

// Chaves públicas usadas pelo Firebase Auth para assinar os ID tokens
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

function projectId() {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    "oasis-imports"
  );
}

function allowedEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type FirebaseUser = { uid: string; email: string };

/**
 * Valida um ID token emitido pelo Firebase Auth (assinatura, emissor,
 * audiência e expiração) e, se ADMIN_EMAILS estiver definido, confere se o
 * e-mail está autorizado a acessar o painel.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseUser> {
  const id = projectId();
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${id}`,
    audience: id,
    algorithms: ["RS256"],
  });

  const uid = String(payload.sub || "");
  const email = String(payload.email || "").toLowerCase();
  if (!uid) throw new AuthError("Token inválido.");

  const allowed = allowedEmails();
  if (allowed.length) {
    if (!email || !allowed.includes(email))
      throw new AuthError("Este usuário não tem permissão para acessar o painel.");
  } else {
    console.warn(
      "[auth] ADMIN_EMAILS não definido: qualquer usuário do Firebase Auth pode acessar o painel.",
    );
  }

  return { uid, email };
}

export class AuthError extends Error {}

