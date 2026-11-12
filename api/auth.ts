import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSession, clearSession, isAuthenticated } from "./_lib/auth.js";
import { AuthError, verifyFirebaseIdToken } from "./_lib/firebaseAuth.js";
import { fail, method } from "./_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action || "session");
  try {
    if (action === "session") {
      if (!method(req, res, ["GET"])) return;
      return res.json({ authenticated: await isAuthenticated(req) });
    }
    if (action === "logout") {
      if (!method(req, res, ["POST"])) return;
      clearSession(res);
      return res.json({ ok: true });
    }
    if (action === "login") {
      if (!method(req, res, ["POST"])) return;
      const idToken = String(req.body?.idToken || "");
      if (!idToken) return res.status(400).json({ error: "Token de acesso ausente." });
      try {
        const user = await verifyFirebaseIdToken(idToken);
        await createSession(res, user);
        return res.json({ ok: true, email: user.email });
      } catch (error) {
        const message =
          error instanceof AuthError ? error.message : "Não foi possível validar o login.";
        return res.status(error instanceof AuthError ? 403 : 401).json({ error: message });
      }
    }
    return res.status(404).json({ error: "Ação não encontrada." });
  } catch (error) {
    return fail(res, error);
  }
}
