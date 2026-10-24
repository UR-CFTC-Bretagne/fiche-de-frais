# Adaptateur Drive pour archives chiffrées — prérequis

## Ce qui est présent

Un adaptateur `DriveEncryptedRecordRepository` transforme uniquement des `EncryptedRecord` (nonce et ciphertext) en objets opaques. Le fournisseur `AppsScriptOpaqueObjectGateway` peut écrire/lire dans un dossier Drive déterminé explicitement, avec verrou Apps Script et contrôle des doublons au niveau du projet. Des tests utilisent exclusivement une fausse passerelle en mémoire.

## Limites importantes

- **Aucun accès Drive réel n'a été effectué.** Le code n'est pas déployé, aucune archive réelle n'a été écrite.
- Le chiffrement AES-GCM existant utilise Web Crypto, qui n'est pas directement disponible dans Apps Script ; l'assemblage chiffré complet n'est donc **pas opérationnel dans Apps Script**.
- L'absence de doublons est garantie seulement entre opérations respectant le même verrou Apps Script ; Drive n'offre pas d'unicité automatique des noms, des tiers peuvent créer des doublons.
- L'adaptateur Drive ne vérifie pas seul le rôle de l'appelant : l'authentification serveur, la restriction du dossier, et les habilitations restent obligatoires.
- La politique de rétention et de rotation des clés, la surveillance d'échecs, et les procédures de reprise ne sont pas implémentées.

## Avant une utilisation réelle

1. Définir un périmètre Drive dédié, privé et limité aux responsables autorisés.
2. Valider la stratégie d'identité de l'appelant, de chiffrement compatible Apps Script et de gestion des clés.
3. Vérifier les permissions effectives et empêcher les accès directs non autorisés.
4. Tester, avec des données entièrement fictives, les sauvegardes, les doublons, les altérations et la restauration sur un environnement isolé.
5. Documenter les contrôles RGPD, le plan de reprise et les procédures de supervision.

En l'état, la passerelle constitue un **prototype d'intégration**, non une sauvegarde de production.
