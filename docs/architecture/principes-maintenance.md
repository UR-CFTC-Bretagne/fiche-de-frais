# Standards d'architecture — modularité, maintenabilité, évolutivité

## But
Le logiciel de notes de frais est un **monolithe modulaire** : une seule application déployée, mais des modules et contrats clairement séparés. Il ne faut pas introduire de microservices tant qu'un besoin concret ne le justifie.

## Sens autorisé des dépendances
```text
interface/web       ──> application/ports et cas d'usage
infrastructure      ──> application/ports + domain
application         ──> domain
domain              ──> aucune dépendance externe
```
L'assemblage des dépendances s'effectuera dans un **composition root** dédié, une fois la stratégie d'authentification définie. Les cas d'usage ne doivent jamais importer `SpreadsheetApp`, `DriveApp` ou un adaptateur concret.

## Domaines fonctionnels
- **notes** : création, brouillon, lignes de dépenses, statut.
- **barèmes** : politique par date d'effet, catégorie et réunion ; interdiction de coder en dur des plafonds non arbitrés.
- **justificatifs** : métadonnées, contrôle de présence, conservation, accès privé.
- **validations** : transitions d'état autorisées, séparation des tâches, journal d'événements.
- **analytique** : affectations URB/AGFPN, équilibre des imputations et éligibilité distincte.
- **paiements** : suivi des règlements, identifiants stables, idempotence et rapprochement.
- **référentiels** : instances, personnes habilitées, activités, versions de règles.
- **reporting** : lectures et exports ; aucun calcul financier divergent du domaine.

Ces responsabilités sont des limites conceptuelles. Il n'est pas nécessaire de créer un dossier vide pour chaque sous-domaine avant de coder.

## Exigences de maintenabilité
1. **Ports et adaptateurs** : isoler Sheets, Drive et Gmail derrière des interfaces ; permettre de remplacer Sheets sans modifier les services métiers.
2. **Tests** : pour chaque règle financière, couvrir cas nominal, limite, erreur, arrondi et version de barème ; utiliser des données fictives.
3. **Compatibilité** : toute modification de schéma de stockage comporte une migration, une version, un test de reprise et une procédure de retour arrière.
4. **Auditabilité** : stocker les paramètres ayant conduit à un calcul ; ne pas recalculer silencieusement les montants historiques.
5. **Sécurité** : identité déterminée côté serveur, moindre privilège, pas de secret ou de données réelles dans le dépôt public.
6. **Qualité du code** : petites unités cohérentes, typage strict, revue via Pull Request, CI obligatoire, décision d'architecture (ADR) pour les changements transverses.
7. **Évolutivité** : contrats stables et versionnés, préférer l'ajout d'adaptateurs ou de modules au changement des règles existantes ; éviter les dépendances circulaires.

## Contrôles automatiques
`npm run check:architecture` refuse les appels directs aux services Google dans `domain` et `application`, ainsi que les imports de couches extérieures dans le cœur métier. Ce contrôle est volontairement élémentaire : une règle ESLint dédiée ou un outil d'analyse des dépendances devra compléter la vérification des imports non relatifs, des cycles et des limites de domaines.

## Conditions de qualité d'une User Story
Une fonctionnalité n'est considérée terminée qu'après tests automatisés, vérification d'habilitations, documentation des règles, gestion des erreurs, CI réussie et revue du code. Une intégration Google réelle exige en plus une recette de sécurité et de confidentialité.
