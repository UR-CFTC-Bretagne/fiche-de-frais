# Module justificatifs — prototype de métadonnées

## Réalisations
Le référentiel métier `Attachment` décrit une pièce liée à une note ou à une ligne de frais : type, référence privée de stockage, empreinte SHA-256, type MIME, taille et date de dépôt.

Le cas d'usage `RegisterAttachment` contrôle le rôle actif `CLAIMANT`, l'appartenance de la note au demandeur, son statut `DRAFT` et le rattachement de la ligne. La persistance actuelle est uniquement **en mémoire**.

## Garanties et limites
- Un identifiant Drive arbitraire peut encore être présenté comme `privateFileRef` : les contrôles de format ne prouvent pas que le fichier existe, que son contenu correspond à l'empreinte ou qu'il a été déposé par l'utilisateur autorisé.
- Aucune pièce réelle n'est lue ou déposée ; aucun transfert de fichier n'est implémenté.
- Antivirus, vérification MIME sur octets réels, limites d'accès et stockage Drive privé seront vérifiés par un service serveur futur.
- Les durées de conservation nécessitent une décision RGPD ; aucune suppression automatique n'est prévue.
- Les validations et persistances multi-objets devront être rendues transactionnelles avant production.

Cette première étape structure le modèle sans gérer de justificatifs personnels réels.
