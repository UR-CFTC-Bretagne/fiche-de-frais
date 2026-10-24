# Sauvegarde et restauration — protocole de recette

Le logiciel possède désormais un générateur d'archive **en mémoire** et un vérificateur de contenu avec empreinte SHA-256, métadonnées de version, contrôles de structure et validation préalable à la restauration. Des tests avec des données exclusivement fictives sont prévus dans `tests/unit/backup-archive.test.ts`.

## Barrières non levées

- Aucune archive contenant des données réelles n'est générée ni déposée sur Google Drive.
- Le payload produit par `prepareBackup` n'est **pas chiffré**. Il ne doit être stocké que lorsque l'adaptateur de stockage privé chiffré, la gestion des clés et le contrôle des habilitations auront été validés.
- `verifyBackup` **n'écrit pas** sur un tableur. L'import de données reste à construire dans une transaction de recette isolée, sur un tableur vide et après validation.
- Les métadonnées et le digest doivent être protégés contre une modification malveillante ; une empreinte non authentifiée ne remplace pas une signature ni le contrôle d'accès.
- Les montants et autres données sensibles ne sont pas destinés aux journaux applicatifs ou aux issues GitHub.

## Étapes de recette à préparer

1. Créer un tableur de recette vierge et des données entièrement fictives, avec autorisations minimales.
2. Vérifier les en-têtes et la version du schéma de stockage.
3. Créer une sauvegarde par lecture cohérente, sous verrou, calculer l'empreinte SHA-256 et le manifeste.
4. Chiffrer et stocker l'archive dans un espace privé ; documenter l'identifiant, la rétention et la procédure de récupération.
5. Restaurer sur une cible vide isolée, puis comparer les enregistrements et les totaux, en consignant l'autorisation, la date et le résultat.
6. Vérifier l'échec explicite des archives altérées, des versions incompatibles et des cibles non vides.

Le protocole doit être validé par les responsables métier, sécurité et RGPD avant un pilote utilisant des données réelles.
