# fil-rouge


# QUIZZ GAME MNS

**Application de QCM personnalisés en mode SAAS**

Projet DFS 2024-2025

Développé par Enzo Da Cunha Alves

---

## 📜 Présentation du projet

QUIZZ GAME MNS est une plateforme SaaS de création et de gestion de quiz interactifs pour évaluer les compétences des collaborateurs et dynamiser les formations, séminaires ou processus RH.

Elle repose sur une forte orientation **gamification** (classements, badges, scores) et s'adapte à tout type d'organisation.

- **Scalable**, **sécurisé** (RGPD), **éco-conçu**
- Déploiement en containers Docker
- Architecture MVC Node.js + Angular + MongoDB

---

## 🚀 Fonctionnalités principales

* 🔹 Création de comptes utilisateurs et organisations
* 🔹 Gestion de profils, badges et avatars
* 🔹 Création de quiz publics/privés et de questions variées :
  * QCM
  * Ordre
  * Associations (gauche/droite)
  * Chercher l'intrus
  * Blind test
* 🔹 Système de notation et de classement en temps réel
* 🔹 Jeu en solo ou en équipe
* 🔹 Responsive Design pour une utilisation mobile
* 🔹 Historique de participation et export des données

---

## 🛠️ Stack technique

| Front-end | Back-end             | Base de données | Authentification | Orchestration       |
| :-------- | :------------------- | :--------------- | :--------------- | :------------------ |
| Angular   | Node.js (Express.js) | MongoDB          | JWT              | Docker / Kubernetes |

**Technologies complémentaires :**
- **Nginx** pour le reverse proxy
- **Elastic Stack (ELK)** pour la gestion des logs
- **CI/CD** avec **GitHub Actions** ou **GitLab CI**

---

## 🧹 Modélisation de la base de données

- **users** : gestion des utilisateurs
- **quizzes** : gestion des quiz
- **questions** : gestion des questions liées aux quiz
- **answers** : réponses possibles par question
- **scores** : historique des résultats
- **rankings** : classement général

---

## 🎯 Objectifs SMART

- Atteindre 100 utilisateurs actifs sous 3 mois après lancement
- 50 quiz créés dans les 2 premiers mois
- Temps de réponse moyen par question < 30 secondes
- Taux d’adoption cible de 70 % au sein d'une entreprise cliente

---

## 📈 Architecture logicielle

* **Modèle MVC** pour une meilleure séparation des responsabilités
* **API REST** sécurisée en Node.js
* **JWT** pour l'authentification et la gestion des sessions
* **MongoDB** hébergé via MongoDB Atlas ou en container Docker
* **Déploiement scalable** (local via Docker Compose, production via Kubernetes)

---

## ♻️ Normes et standards respectés

* **RGPD** : Anonymisation et sécurisation des données sensibles
* **Accessibilité** : Conformité RG2A / WCAG 2.1
* **Éco-conception** : Optimisation des requêtes, compression des fichiers statiques, hébergement green IT
* **Sécurité** : Suivi des bonnes pratiques OWASP
* **Qualité** : Respect des standards HTML5, CSS3, JS modernes

---

## 🛡️ Sécurité et conformité

* Stockage sécurisé des mots de passe (bcrypt)
* Gestion sécurisée des tokens d’authentification
* Analyse d'impact sur la protection des données (PIA)
* Surveillance via Elastic Stack pour les erreurs et incidents
* Respect des standards ISO 27001, ISO 9001

---

## 🗓️ Organisation de projet

* **Méthodologie** : Agile (Scrum)
* **Sprints** : 2 à 3 semaines
* **Outils de gestion** : GitHub Projects / GitLab Issues
* **Diagramme de Gantt** : Suivi prévisionnel et analyse des écarts

---

## 📚 Documentation

* Cahier des charges et spécifications fonctionnelles
* Dossier de modélisation & Lot 1

---

## 👤 Auteur

**Enzo Da Cunha Alves**  
*Développeur fullstack, Chef de projet, UX/UI Designer, DevOps*

---


## 🔥 Démarrage rapide (local)

Avant de démarrer, veillez à créer les fichiers `.env` suivants :

- **À la racine du projet** :  
  Créez un fichier `.env` contenant les variables d'environnement pour MongoDB (exemple fourni dans le dépôt).

- **Dans le dossier `backend`** :  
  Créez un fichier `.env` pour les variables d'environnement spécifiques à l'API (JWT_SECRET, configuration de la base, etc.).

```bash
# Cloner le projet
git clone https://github.com/your-username/quizz-game-mns.git

# Backend Setup
cd backend
npm install

# Frontend Setup
cd ../frontend
npm install

# Revenir à la racine du projet
cd ..

# Lancer les containers Docker
docker-compose up --build

# Accéder à l'application
http://localhost
```

---

**Enjoy the game! 🌟**