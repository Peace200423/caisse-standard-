export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Réponse invalide du serveur (pas du JSON). Réessayez dans un instant." };
      }
    } else if (!res.ok) {
      data = { error: `Erreur serveur (code ${res.status}).` };
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Impossible de contacter le serveur. Vérifiez votre connexion." } as any,
    };
  }
}
