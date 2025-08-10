# QUIZZ GAME MNS

Plateforme SaaS de QCM personnalisés — Front Angular, API Node/Express, MongoDB, packagée avec Docker.

---

## Vue d’ensemble

- Création/gestion d’organisations, utilisateurs, quiz et questions
- Authentification JWT, validation, protections OWASP (helmet, rate limit, hpp, xss)
- Paiement Stripe (donations), envoi email (Nodemailer)
- Tests unitaires et d’intégration avec Jest + Supertest + Mongo Memory Server

---

## Architecture

- frontend: Angular 19 servi par Nginx en container
- backend: Node.js/Express (MVC) + Mongoose
- mongo: base de données MongoDB (container) ou Atlas
- Orchestration: docker-compose

Arborescence (extrait):

```
backend/          # API Express, tests Jest
frontend/         # Application Angular + Nginx
docker-compose.yml
```

---

## Prérequis

- Node.js 18+ et npm (pour dev local)
- Docker Desktop (Windows/macOS/Linux) et Docker Compose
- Clés Stripe (test) si vous activez les paiements
- Compte email (ex: Gmail) si vous activez l’envoi de mails

---

## Configuration des variables d’environnement

1) À la racine du projet, créez un fichier `.env` (utilisé par docker-compose pour le service `mongo`):

```
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
```

2) Dans `backend/.env`, copiez/adapter depuis `backend/.env.example`:

```
PORT=3000

# Connexion Mongo (container local)
MONGO_URI=mongodb://root:example@mongo:27017/quizzgame?authSource=admin

# Option Atlas (si vous n’utilisez pas le container)
MONGO_URI_ATLAS=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/

# Auth
JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Frontend URLs
FRONTEND_URL_LOCAL=http://localhost:4200
FRONTEND_URL_PRODUCTION=https://your-production-domain.com
```

Remarque: le fichier `.env` racine est distinct de `backend/.env`. Le premier alimente le container Mongo; le second configure l’API.

---

## Démarrage rapide

### Option A — Docker (recommandé)

1) Créez les fichiers `.env` décrits ci-dessus
2) À la racine du projet, lancez:

```bash
docker-compose up --build
```

Accès:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000 (ex: /api/health)
- MongoDB: localhost:27017

Arrêt des containers: `Ctrl + C` puis `docker-compose down` si besoin.

### Option B — Développement local (sans Docker)

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm start
```

Assurez-vous que `backend/.env` pointe vers une base Mongo joignable (locale ou Atlas). Par défaut, l’API écoute sur le port 3000 et le front sur 4200.

---

## Scripts utiles

Backend (`backend/package.json`):
- `npm run dev` — démarre l’API avec nodemon
- `npm start` — démarre l’API en production
- `npm test` — lance Jest (runInBand)
- `npm run test:watch` — mode watch
- `npm run test:coverage` — couverture de tests

Frontend (`frontend/package.json`):
- `npm start` — `ng serve`
- `npm run build` — build prod vers `dist`
- `npm test` — tests Angular/Karma

---

## Tests backend

La suite Jest couvre middlewares (auth, sécurité, validation, logger), modèles (User, Organization, Quiz, Question, Answer, QuizResult), services (email), routes/contrôleurs (auth, organization, quiz, stripe) et serveur (/api/health, 404).

Exécution:

```bash
cd backend
npm install
npm test
```

Modes:
- Watch: `npm run test:watch`
- Couverture: `npm run test:coverage` (rapports dans `backend/coverage`)

---

## Sécurité

- Headers et protections: helmet, hpp, xss, CORS, rate limit
- Auth: JWT (bcrypt pour les mots de passe)
- Logs sécurité et validation centralisée

---

## Déploiement

- Images Docker pour front (Nginx) et back (Node)
- Variables d’environnement via fichiers `.env`
- Remplacez `MONGO_URI` par votre URI Atlas en production si nécessaire

---

## Aide & contributions

Issues et PR bienvenues. Merci de décrire clairement le contexte, les étapes de repro et l’impact.

—

Enjoy the game ✨