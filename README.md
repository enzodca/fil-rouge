# QUIZZ GAME MNS

Plateforme de quiz avec Front Angular 19, API Node/Express, MongoDB, packagée avec Docker et déployée via GitHub Actions sur Netlify (front) et Render (API).

## Sommaire

- Stack et structure
- Démarrage local (Docker et sans Docker)
- Configuration des variables d’environnement
- Sécurité et endpoints santé
- Tests
- CI/CD et déploiement (Netlify + Render)
- Dépannage rapide (FAQ)

## Stack et structure

- frontend: Angular 19, servi par Nginx en prod; SPA redirects via `src/_redirects`
- backend: Node.js/Express + Mongoose; protections helmet, rate limit, hpp, xss
- mongo: service Docker local ou MongoDB Atlas en prod
- orchestration: docker-compose

Arborescence (extrait):

```
backend/          # API Express, tests Jest
frontend/         # Angular app + Nginx
.github/workflows # CI (build/tests) + déploiement prod
```

## Démarrage local

Pré-requis: Node 18+, npm, Docker Desktop.

### Option A — Docker (recommandé)

1) À la racine, créez `.env` pour Mongo Docker:

```cmd
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
```

2) Dans `backend/.env` (non committé), configurez votre API (exemple ci-dessous).
3) Lancez les services:

```cmd
docker compose up -d --build
```

Accès:
- Front: http://localhost:4200
- API: http://localhost:3000 (ex: GET /api/health ou /healthz)
- Mongo: localhost:27017

Arrêt (optionnel):

```cmd
docker compose down
```

### Option B — Sans Docker

Backend:

```cmd
cd backend
npm ci
npm run dev
```

Frontend:

```cmd
cd frontend
npm ci
npm start
```

Assurez-vous que `backend/.env` pointe vers une instance Mongo joignable.

## Configuration des variables d’environnement

Le backend valide la configuration via envalid (`backend/env.js`). Principales variables:

Exemple `backend/.env` (développement local):

```ini
PORT=3000
# Mongo local (container docker "mongo")
MONGODB_URI=mongodb://root:example@mongo:27017/quizzgame?authSource=admin
# JWT (dev)
JWT_SECRET=change_me_dev
# Stripe (dev)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# Email (dev)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
# CORS: origines autorisées (CSV)
FRONTEND_ORIGIN=http://localhost:4200
```

Notes:
- Utilisez `MONGODB_URI` unique (local ou Atlas). Les anciens `MONGO_URI`/`MONGO_URI_ATLAS` ne sont plus utilisés.
- CORS se base sur `FRONTEND_ORIGIN` (CSV). En dev, localhost:4200 est autorisé par défaut.
- Ne committez jamais `backend/.env` (déjà ignoré par `.gitignore`).

Frontend:
- `src/environments/environment.ts` (dev) utilise `apiBaseUrl` = `http://localhost:3000/api`.
- `environment.prod.ts` contient un placeholder `__API_BASE_URL__` remplacé par la CI au build prod. Aucun secret n’est exposé côté front.

## Sécurité et endpoints santé

- Sécurité: helmet, rate limit (désactivé en test), hpp, xss, journaux sécurité, `app.set('trust proxy', 1)`.
- CORS strict par `FRONTEND_ORIGIN` (CSV), différencié dev/prod.
- Santé: `GET /healthz` (liveness) et `GET /api/health` (details).

## Tests

Backend (Jest + Supertest):

```cmd
cd backend
npm ci
npm test
```

Rapports: `backend/coverage/`.

## CI/CD et déploiement (prod)

Branche de production: `prod`.

Workflows GitHub (`.github/workflows`):
- `ci.yml`: sur chaque push/PR — installe, build (front) et teste (back), Node 20.
- `deploy-prod.yml`: sur push vers `prod` — build Angular prod, déploie sur Netlify, puis déploie l’API sur Render (et attend la fin).

Secrets requis (environnement GitHub « production »):
- `API_BASE_URL`: URL publique de l’API avec suffixe `/api` (ex: `https://<service>.onrender.com/api`).
- `NETLIFY_AUTH_TOKEN`: token personnel Netlify.
- `NETLIFY_SITE_ID`: ID du site Netlify cible.
- `RENDER_SERVICE_ID`: ID du service Render existant (API Node).
- `RENDER_API_KEY`: API key Render.

Configuration côté Render (dans le dashboard, pas besoin de `render.yaml`):
- Dossier racine du service: `backend`.
- Build command: `npm ci`.
- Start command: `node server.js`.
- Health check path: `/healthz`.
- Variables d’env (production): `NODE_ENV=production`, `MONGODB_URI` (Atlas), `FRONTEND_ORIGIN` (origine Netlify, ex: `https://<site>.netlify.app`), `JWT_SECRET`, clés Stripe, credentials email, etc.

Configuration côté Netlify (pas besoin de `netlify.toml`):
- Le workflow déploie le dossier `dist/frontend` (ou `dist/frontend/browser`).
- SPA redirects via `src/_redirects` (`/* /index.html 200`).
- Vous pouvez aussi configurer build/publish dans l’UI, mais la CI utilise Netlify CLI + secrets.

Aucun fichier `render.yaml` ni `netlify.toml` n’est requis si vos services sont déjà créés et configurés via leurs dashboards. Gardez une seule source de vérité (UI ou fichiers) pour éviter les conflits.

## Dépannage rapide (FAQ)

- CORS: 403 « Not allowed by CORS » → vérifier `FRONTEND_ORIGIN` (doit contenir l’URL Netlify exacte en prod).
- Front affiche erreur API → vérifier `API_BASE_URL` (secret GitHub) et que la route `/api` est incluse.
- SPA 404 sur Netlify → vérifier que `src/_redirects` est bien packagé (déjà dans `angular.json`).
- Mongo connexion échoue en prod → valider `MONGODB_URI` Atlas dans Render; consulter les logs Render.
- Port Render → l’API écoute `process.env.PORT` fourni par Render (fallback 3000 en local).

## Push pour déployer

1) Configurez les secrets GitHub (environnement « production ») listés ci-dessus.
2) Assurez-vous que le service Render et le site Netlify existent.
3) Pushez sur la branche `prod` pour déclencher `deploy-prod.yml`.

---

Licence: ISC