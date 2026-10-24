# Justificatifs : exigence d'attestation côté serveur

Depuis cette révision, `RegisterAttachment` exige un `StoredAttachmentVerifier` injecté. Une référence et une empreinte envoyées par le navigateur ne suffisent plus pour enregistrer une pièce.

## Contrat de vérification

L'implémentation serveur devra vérifier, avant d'émettre une attestation :
- le fichier existe dans le périmètre privé autorisé, sans accès public par lien ;
- sa provenance et son rattachement au demandeur et à la note sont établis par le serveur ;
- l'empreinte SHA-256 est calculée à partir des octets réellement stockés ;
- le type MIME est déterminé à partir du contenu, avec politique de filtrage et analyse anti-malware ;
- la taille correspond aux octets conservés, et les autorisations Drive ont été contrôlées ;
- l'attestation ne peut être créée ni falsifiée par le client.

Le cas d'usage refuse une attestation absente ou divergente sur la référence, le propriétaire, le rattachement, la taille, le type MIME ou l'empreinte. Les données sont fictives dans les tests.

## Risques et prochaines étapes

Le port `StoredAttachmentVerifier` est **un contrat de confiance**, pas encore un vérificateur Drive réel. Une implémentation naïve qui répéterait les champs de la requête client ne serait pas sûre. Le code de production devra également empêcher les changements de fichier entre contrôle et enregistrement, gérer la suppression/révocation, ainsi que les droits de consultation.

Aucun fichier réel n'a été transféré. Aucun service de dépôt public n'est ouvert.
