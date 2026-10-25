# Bundle Apps Script V8 — recette isolée

Le répertoire généré `build/apps-script/` contient `Code.gs` (bundle de modules métier purs), `Main.gs` (fonction globale `cftcRecetteHealthCheck`) et `appsscript.json`. Le contrôle automatisé exécute la sonde dans une VM Node isolée et refuse les noms d'API sensibles, les endpoints HTTP, les scopes OAuth ou les fichiers imprévus.

Cette sonde vérifie uniquement une opération arithmétique fictive ; **elle ne fournit pas encore de webapp ni de CRUD des frais**. Le bundle est une étape technique pour valider l'assemblage TypeScript → Apps Script, pas une version utilisable par les mandatés.

## Sécurité et mise en service

Aucun `clasp push`, `clasp deploy` ou accès à un projet Google n'est invoqué dans GitHub Actions. Aucun identifiant de script ni jeton n'est configuré dans le dépôt. Avant toute connexion, il faudra ouvrir un projet de recette distinct, installer des autorisations approuvées et une identité serveur, puis tester les droits, la réversibilité, les schémas et l'audit. L'environnement de production reste bloqué jusqu'à validation humaine.
