# Sprint 1 — Socle technique

## Livré dans le dépôt

- Entités de notes et lignes de dépense, représentation monétaire en centimes.
- Contrôle de l'équilibre analytique AGFPN/URB sans décision automatique d'éligibilité.
- Ports `ExpenseReportRepository`, `AuditTrail`, `IdGenerator`, `Clock`.
- Création et lecture contrôlée de brouillons à travers des cas d'usage.
- Dépôt mémoire **fictif**, sans données de production.
- Tests unitaires et workflow CI pour vérifier les types et exécuter les tests.

## Non livré

- Authentification réellement reliée à Google ou à un fournisseur d'identité.
- Adaptateur Google Sheets, Drive ou Gmail fonctionnel.
- Interface web de dépôt de notes, gestion des justificatifs et validation.
- Bundle Google Apps Script final et déploiement.
- Règles UR non arbitrées, paiement réel et exports AGFPN définitifs.

L'application ne doit pas être mise à disposition de véritables utilisateurs avant ces développements et la recette sécurité.
