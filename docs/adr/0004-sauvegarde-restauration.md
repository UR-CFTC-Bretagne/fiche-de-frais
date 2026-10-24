# ADR-0004 — Sauvegardes contrôlées et restauration sans écrasement

**Statut : socle de conception ; aucun mécanisme de sauvegarde réel déployé.**

## Règles

- Les données sensibles ne sont jamais exportées dans ce dépôt GitHub public.
- Un manifeste versionné mentionne l'identifiant, l'horodatage, la version du schéma, le nombre de lignes et une empreinte SHA-256 du contenu.
- La comparaison de l'empreinte doit être réalisée après récupération de l'archive par un adaptateur sécurisé ; la valeur passée au contrôleur ne doit pas être présumée fiable.
- Les archives doivent être chiffrées au repos et accessibles uniquement aux rôles habilités, selon la politique RGPD validée.
- Avant restauration : vérifier le schéma, l'intégrité et le dossier d'autorisation, puis restaurer **uniquement vers une cible vide de recette**.
- Après restauration : rapprocher les totaux et les identifiants, exécuter les tests, documenter le procès-verbal de recette.
- Une restauration en production nécessite une procédure de changement distincte, une sauvegarde préalable, un plan de retour arrière et une approbation expresse.

## Limite du code livré

`BackupManifest`, `BackupStore` et `assessRestore` sont des contrats et validations testables. Ils ne produisent ni ne restaurent de fichier réel. Aucun accès Drive, fichier personnel ou tableur réel n'a été déclenché.

## Prochaines évolutions

Créer un adaptateur d'archives privées avec chiffrement et journal d'audit, la génération et la vérification effective du SHA-256, des sauvegardes périodiques, une vérification de rétention et une recette de restauration sur un tableur entièrement fictif.
