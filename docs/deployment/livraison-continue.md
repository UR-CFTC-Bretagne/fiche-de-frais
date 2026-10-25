# Livraison continue : version initiale

## État réel

Le workflow GitHub Actions `continuous-delivery.yml` reconstruit automatiquement le socle à chaque push sur `main`, après vérification des frontières architecturales, du typage, des tests et de la compilation. Il publie un **artefact versionné de recette** (archive `tar.gz`, empreinte SHA-256, SHA de commit).

**Important : ceci est de la livraison continue (Continuous Delivery), et non encore du déploiement continu dans Google Apps Script.** Les modules TypeScript produits ne sont pas un bundle Apps Script exécutable : l'absence d'entrypoint et d'assemblage adapté interdit une publication sûre.

## Circuits

| Circuit | Déclenchement | Résultat |
| --- | --- | --- |
| Intégration continue | Pull request et push | Contrôles du code et tests |
| Livraison recette | Chaque push sur `main` | Archive de code compilé conservée 14 jours dans Actions |
| Préparation production | Déclenchement manuel `production-gate.yml` | Vérification de révision et rappel des blocages ; aucune publication |
| Production | Désactivée | Aucun accès, aucun scriptId ni secret de déploiement |

## Critères bloquants avant un déploiement réel

1. Établir une interface serveur complète avec authentification, habilitations et journalisation testées.
2. Construire un bundle Apps Script fonctionnel, sans dépendances Node/Web Crypto incompatibles.
3. Préparer une application Apps Script **de recette distincte** et des données **strictement fictives** ; contrôler explicitement les OAuth scopes.
4. Valider le plan de migrations et les sauvegardes restaurables des schémas Sheets.
5. Protéger les accès aux justificatifs, les clés, les remboursements, les pièces syndicales et les données bancaires ; documenter le traitement RGPD.
6. Installer les secrets de déploiement dans un mécanisme approuvé et les permissions GitHub Environments ; aucune clé dans le dépôt public.
7. Exiger une approbation humaine pour la production, tests de fumée, possibilité de revenir à une version précédente et suivi d'audit.
8. N'activer le `clasp push` ou un déploiement Apps Script effectif qu'après validation écrite par les responsables habilités.

## Vérification

GitHub > Actions > « Livraison continue — artefact de recette » > dernier run > « Artifacts » pour récupérer `recette-socle-<commit>`. Contrôler le fichier `SHA256SUMS` avant toute exploitation.

Les fichiers de livraison ne contiennent pas de données personnelles ni de secrets ; leur conservation est limitée à 14 jours. Ils ne doivent pas être déployés tels quels.
