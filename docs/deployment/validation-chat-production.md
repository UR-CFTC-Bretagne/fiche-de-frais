# Validation de mise en production dans nos échanges

L'approbation fonctionnelle de la version du MVP sera donnée explicitement dans la conversation ChatGPT. Une phrase générale (« dès que prêt ») ne valide pas une révision particulière.

Pour préparer une demande, préciser dans la conversation la **révision Git complète**, le bilan de recette, les risques résiduels, le plan de reprise et la cible de production. Une fois la décision explicite obtenue, reporter dans un dossier de décision contrôlé la révision et la référence de l'approbation, sans intégrer de données personnelles dans le dépôt public.

Le fichier `release/mvp-readiness.json` commence avec tous les critères à `false`. Son renseignement devra s'appuyer sur des preuves techniques et organisationnelles revues (tests, recette, confidentialité, barèmes, sauvegardes, rollback). La validation conversationnelle n'outrepasse pas les protections GitHub Environments : les approbateurs techniques nécessaires doivent rester actifs.

Le script `scripts/check-production-readiness.mjs` **refuse la préparation** tant que les critères ou l'approbation correspondant exactement à la révision soumise font défaut. Un simple changement du fichier JSON n'est pas une preuve indépendante : une revue du commit, des artefacts et des habilitations demeure indispensable.

Cette barrière ne déclenche aucun `clasp push` ni déploiement. Les identifiants Google, secrets et paramètres de production doivent rester dans les dispositifs dédiés et ne jamais être committés.
