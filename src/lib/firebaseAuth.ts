import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { auth } from "./firebase";

const messages: Record<string, string> = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/missing-password": "Informe a senha.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/user-not-found": "Usuário não cadastrado no Firebase Auth.",
  "auth/user-disabled": "Este usuário foi desativado.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  "auth/weak-password": "A nova senha é muito fraca (mínimo 6 caracteres).",
  "auth/requires-recent-login": "Por segurança, saia e entre novamente antes de trocar a senha.",
  "auth/operation-not-allowed": "Provedor 'E-mail/senha' desativado no Firebase Console. Ative em Authentication > Sign-in method.",
  "auth/invalid-api-key": "Chave da API do Firebase inválida.",
};

export function authErrorMessage(error: unknown, fallback = "Não foi possível concluir a operação.") {
  const code = (error as { code?: string })?.code;
  if (code && messages[code]) return messages[code];
  return error instanceof Error ? error.message : fallback;
}

/** Faz login no Firebase Auth e devolve o ID token para criar a sessão no servidor. */
export async function firebaseSignIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return await cred.user.getIdToken(true);
  } catch (error) {
    throw new Error(authErrorMessage(error, "Erro ao entrar."));
  }
}

export async function firebaseSignOut() {
  await signOut(auth).catch(() => {});
}

/** Reautentica com a senha atual e define a nova senha no Firebase Auth. */
export async function firebaseChangePassword(current: string, next: string) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || !user.email)
    throw new Error("Sessão do Firebase expirada. Saia e entre novamente.");
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
    await updatePassword(user, next);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "auth/invalid-credential" || code === "auth/wrong-password")
      throw new Error("Senha atual incorreta.");
    throw new Error(authErrorMessage(error));
  }
}

export async function currentUserEmail() {
  await auth.authStateReady();
  return auth.currentUser?.email ?? "";
}

