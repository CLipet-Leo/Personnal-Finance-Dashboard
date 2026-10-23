# Personal Finance Dashboard

Dashboard personnel de suivi et d'audit de finances : import de relevés bancaires CSV, agrégats mensuels, visualisations et table d'audit des opérations.

Usage strictement individuel — pas de multi-utilisateurs, pas d'authentification.

## Stack

| Domaine    | Choix                                                          |
| ---------- | -------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, React 19, Server Components)           |
| Langage    | TypeScript                                                     |
| UI         | Tailwind CSS v4 + shadcn/ui (base `lyra`, Base UI, Phosphor) |
| Graphiques | Recharts, via les composants `chart` de shadcn/ui            |
| Données   | SQLite (`better-sqlite3`) + Drizzle ORM                      |

## Fonctionnalités

Tout tient sur une seule page ; import, règles de tag et détail d'une opération s'ouvrent en panneau latéral.

- **Indicateurs** — entrées, sorties, solde net et opérations à pointer sur la période (ce mois, mois dernier, 3 mois, 12 mois, tout l'historique ou plage libre), avec variation par rapport à la période précédente équivalente, taux d'épargne et dépense moyenne par jour. Cliquer une carte filtre la table.
- **Trésorerie** — solde cumulé, flux quotidiens ou 12 derniers mois (avec moyenne des sorties) ; cliquer un mois bascule la période dessus.
- **Dépenses par catégorie** — part de chaque catégorie, drill-down par sous-catégorie ; le clic filtre aussi la table.
- **Plus grosses dépenses** et **postes récurrents** (moyenne mensuelle par tag sur tout l'historique).
- **Table d'audit** — tri, filtres (sens, catégorie, sous-catégorie, pointage, tag), recherche plein texte, pagination ; clic sur une ligne pour le détail complet et la création d'une règle de tag.
- **Tags personnels** — règles « le libellé contient X → tag » (loyer, abonnements…). Le tag est calculé à la lecture : les règles s'appliquent à tout l'historique et survivent aux réimports.
- **Import CSV** — dépôt par glisser-déposer, déduplication automatique, réimport du même fichier sans effet de bord.
- **Réinitialisation** — vidage de la base depuis le panneau d'import ou en ligne de commande.

L'état des filtres et de la période vit dans l'URL : la page reste un Server Component et chaque vue est partageable.

## Prérequis

- Node.js ≥ 20.9
- pnpm ≥ 9

`better-sqlite3` est un module natif : sa compilation nécessite les outils de build de la plateforme (Xcode CLT sur macOS, `build-essential` sur Linux, Visual Studio Build Tools sur Windows).

## Installation

```bash
pnpm install
pnpm db:migrate   # crée data/dashboard.db et applique les migrations
pnpm dev          # http://localhost:3000
```

Le dossier `data/` est ignoré par Git : la base et les relevés restent strictement locaux.

## Scripts

| Commande             | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`         | Serveur de développement                                                 |
| `pnpm build`       | Build de production                                                      |
| `pnpm start`       | Serveur de production                                                    |
| `pnpm lint`        | ESLint                                                                   |
| `pnpm format`      | Prettier sur tout le projet                                              |
| `pnpm db:generate` | Génère une migration à partir de `src/db/schema.ts`                      |
| `pnpm db:migrate`  | Applique les migrations en attente                                       |
| `pnpm db:import`   | Importe un CSV en ligne de commande (`data/source.csv` par défaut)       |
| `pnpm db:reset`    | Vide la table `transactions` (`--yes` pour sauter la confirmation)       |
| `pnpm shadcn`      | Permet l'ajout d'un composant shadcn ui depuis un registre               |

## Format CSV attendu

Export bancaire encodé en **latin1**, séparateur `;`, avec cette ligne d'en-tête :

```
Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
```

- Dates au format `JJ/MM/AAAA`, converties en ISO `AAAA-MM-JJ` à l'import.
- `Debit` et `Credit` sont mutuellement exclusifs et stockés dans une seule colonne `amount` signée (négatif = débit).
- `Pointage operation` accepte `0`/`1`, `oui`/`non` ou un libellé contenant « point ».

### Déduplication

Chaque opération reçoit une empreinte SHA-1 (`fingerprint`, unique en base) calculée sur les trois dates, les libellés, la référence, les informations complémentaires, le type et le montant — plus un rang d'occurrence.

Ce rang permet de conserver deux opérations réellement identiques le même jour, tout en garantissant qu'un réimport du même fichier n'insère rien. Une simple contrainte composite ne suffisait pas : la référence bancaire est parfois vide, et SQLite considère deux `NULL` comme distincts.

## Structure

```
src/
  app/
    page.tsx              Dashboard, unique page (Server Component)
    actions/              Server Actions (import CSV, reset, règles de tag)
  components/
    dashboard/            Cards, graphiques, filtres, table d'audit, panneaux
    import-sheet.tsx      Panneau d'import et de réinitialisation
    ui/                   Composants shadcn/ui
  db/
    schema.ts             Schéma Drizzle
  drizzle/                Migrations générées
  hooks/                  Synchronisation des filtres avec l'URL
  lib/                    Période, formats fr-FR, utilitaires
  services/               Requêtes SQL agrégées et parsing CSV
scripts/                  Import, reset et vérifications (`pnpm tsx scripts/check-tags.ts`, `check-period.ts`)
data/                     Base SQLite et relevés (non versionnés)
```

Toutes les agrégations (`sum`, `group by`, `count`, pagination) sont faites en SQL dans `src/services/DBService.ts` — aucun recalcul côté client.

## Déploiement

La base est un fichier SQLite local (`data/dashboard.db`, relatif au répertoire de travail). Le projet a donc besoin d'un **système de fichiers persistant** : un VPS, un conteneur avec volume ou Fly.io conviennent, contrairement aux plateformes serverless à filesystem éphémère.

Drizzle abstrayant le driver, un passage vers Postgres ou Turso ne demanderait que de remplacer `src/db/index.ts` et le `dialect` de `drizzle.config.ts`.
