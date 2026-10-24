# Chiffrement des sauvegardes — prototype de recette

Le code distingue trois responsabilités : `BackupStore` (contrat), `AuthenticatedCipher` (chiffrement) et `EncryptedRecordRepository` (stockage des octets chiffrés). Le fournisseur `WebCryptoAesGcm` applique AES-256-GCM avec nonce aléatoire de 96 bits, tag d'authentification de 128 bits et identifiant de sauvegarde comme donnée associée.

**Périmètre livré :** stockage en mémoire fictif et tests. Aucune connexion Drive ni accès à des clés réelles. L'API Web Crypto est adaptée à une exécution de test Node/browser et **n'est pas directement un adaptateur Google Apps Script**.

**Conditions préalables à la production :** stockage des clés dans un service approprié, rotation et récupération sécurisée, politiques IAM et RGPD, chiffrement effectif sur un environnement Apps Script approprié ou via un service externe validé, durée de conservation, journal d'audit et sauvegarde cohérente du tableur source.

Ce code ne fournit ni mécanisme de sauvegarde périodique, ni procédure complète de reprise après incident.
