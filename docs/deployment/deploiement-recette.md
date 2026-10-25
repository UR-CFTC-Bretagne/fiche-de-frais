# Déploiement contrôlé sur Google Apps Script de recette

Le workflow `.github/workflows/staging-deploy.yml` est **manuel et inactif par défaut** : un lancement Actions seul n'autorise aucun envoi Google. Il faut configurer expressément l'environnement GitHub `recette`.

## Configuration à effectuer par les administrateurs habilités

1. Créer un **projet Google Apps Script distinct**, réservé aux données entièrement fictives. Ne pas utiliser le projet de production ni le Drive partagé contenant les mandats.
2. Activer l'API Google Apps Script pour le compte de déploiement et obtenir des identifiants OAuth via `clasp login` sur un poste administré.
3. Créer l'environnement GitHub `recette` avec les règles de protection appropriées (approbation humaine, limitation de branche à `main`).
4. Définir dans cet environnement les variables `RECETTE_SCRIPT_ID` et `RECETTE_APPROVED_SCRIPT_ID`, identiques uniquement après validation du script cible. Le script ne doit avoir aucun scope OAuth.
5. Enregistrer les identifiants `.clasprc.json` uniquement dans le secret d'environnement `RECETTE_CLASPRC_JSON`, jamais dans le dépôt ni dans les journaux.
6. Une fois la recette préparée et validée, activer la variable `ENABLE_RECETTE_DEPLOY=true` au niveau du dépôt (condition évaluée avant entrée dans l'environnement), puis déclencher explicitement « Déploiement vers Apps Script de recette (opt-in) ».

Le workflow reconstruit le code et exécute l'intégralité des tests avant d'écrire. Il refuse les identifiants de projet incohérents et les scopes OAuth non vides. Il publie **uniquement la sonde non sensible** `cftcRecetteHealthCheck()` et crée une version de recette.

**Aucun déploiement automatique en production**, aucun endpoint public et aucune synchronisation avec des tableurs réels ne sont activés. Le `clasp push --force` remplace le code distant du projet choisi : utiliser exclusivement un projet de recette dédié, sans script métier ou données préexistantes. Vérifier la sonde et la version dans l'éditeur Apps Script.

## Sécurité et limites

- La variable d'activation est au niveau du dépôt : garder sa valeur absente ou `false` tant que toutes les barrières ne sont pas en place.
- Les identifiants OAuth conservés dans GitHub Actions donnent des droits au compte : les protéger et les renouveler selon la politique organisationnelle.
- Un contrôle supplémentaire des identifiants (double saisie) prévient une faute de configuration simple ; il ne constitue pas une autorisation indépendante si les mêmes administrateurs gèrent les deux variables.
- Préparer ultérieurement une procédure de retour arrière via versions Apps Script, tests sur la plateforme Google, supervision, contrôle d'accès des fichiers et approbation de production.
