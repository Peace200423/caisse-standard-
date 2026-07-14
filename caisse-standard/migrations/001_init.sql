-- Schéma "Caisse Standard" — générique, valable pour n'importe quel commerce
-- (boutique, restaurant, salon, pharmacie, maquis...)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Un commerce = un tenant. Isolation logique via tenant_id sur toutes les tables.
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,        -- code court d'accès, ex: "BTQ4821"
  nom           TEXT NOT NULL,
  telephone     TEXT,
  ville         TEXT DEFAULT 'Cotonou',
  statut        TEXT NOT NULL DEFAULT 'essai', -- essai | actif | suspendu
  essai_fin     TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  abonnement_fin TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Utilisateurs rattachés à un commerce (patron, vendeur...)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  pin_hash      TEXT NOT NULL,               -- PIN 4-6 chiffres, hashé
  role          TEXT NOT NULL DEFAULT 'vendeur', -- patron | vendeur
  actif         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogue optionnel — un commerce peut ne jamais s'en servir
CREATE TABLE articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  prix          NUMERIC(12,2) NOT NULL,
  stock         INTEGER,                      -- NULL = pas de suivi de stock
  seuil_alerte  INTEGER,
  actif         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client à crédit (ardoise)
CREATE TABLE clients_credit (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  telephone     TEXT,
  solde_du      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vente : soit liée à un article du catalogue, soit en libellé libre.
-- C'est ce qui rend l'appli valable "peu importe la vente".
CREATE TABLE ventes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  article_id    UUID REFERENCES articles(id),
  libelle       TEXT NOT NULL,               -- copie du nom article, ou texte libre
  montant       NUMERIC(12,2) NOT NULL,
  quantite      INTEGER NOT NULL DEFAULT 1,
  mode_paiement TEXT NOT NULL DEFAULT 'cash', -- cash | momo | moov | credit
  client_credit_id UUID REFERENCES clients_credit(id),
  client_uuid   TEXT,                         -- id généré côté appareil (pour sync offline, évite doublons)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ventes_client_uuid_unique ON ventes(tenant_id, client_uuid) WHERE client_uuid IS NOT NULL;

-- Mouvements de caisse hors vente (apport, retrait, dépense)
CREATE TABLE mouvements_caisse (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  type          TEXT NOT NULL,                -- entree | sortie
  libelle       TEXT NOT NULL,
  montant       NUMERIC(12,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ventes_tenant_date ON ventes(tenant_id, created_at DESC);
CREATE INDEX idx_articles_tenant ON articles(tenant_id) WHERE actif = true;
CREATE INDEX idx_credits_tenant ON clients_credit(tenant_id);
