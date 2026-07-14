// Queue offline simple basée sur localStorage.
// Chaque vente créée hors-ligne reçoit un uuid côté appareil (clientUuid) qui sert
// de clé d'idempotence côté serveur — si la même requête est rejouée, pas de doublon.

const QUEUE_KEY = 'caisse_pending_sales_v1';

export type PendingSale = {
  clientUuid: string;
  libelle: string;
  montant: number;
  quantite: number;
  articleId?: string | null;
  modePaiement: string;
  clientCreditId?: string | null;
  createdAtLocal: string;
};

function readQueue(): PendingSale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingSale[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSale(sale: Omit<PendingSale, 'clientUuid' | 'createdAtLocal'>): PendingSale {
  const entry: PendingSale = {
    ...sale,
    clientUuid: crypto.randomUUID(),
    createdAtLocal: new Date().toISOString(),
  };
  const queue = readQueue();
  queue.push(entry);
  writeQueue(queue);
  return entry;
}

export function getPendingCount(): number {
  return readQueue().length;
}

// Tente d'envoyer chaque vente en attente. Ne retire de la file que celles confirmées.
export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { sent: 0, remaining: 0 };

  const stillPending: PendingSale[] = [];
  let sent = 0;

  for (const sale of queue) {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
      });
      if (res.ok) {
        sent++;
      } else {
        stillPending.push(sale);
      }
    } catch {
      // pas de réseau — on garde tout le reste dans la file et on arrête
      stillPending.push(sale, ...queue.slice(queue.indexOf(sale) + 1));
      break;
    }
  }

  writeQueue(stillPending);
  return { sent, remaining: stillPending.length };
}
