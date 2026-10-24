# Politique de clés des sauvegardes (proposition à valider)

## Périmètre
Les sauvegardes peuvent contenir des données personnelles sensibles sur des représentants syndicaux. La présence d'un chiffrement AES-256-GCM dans le code ne suffit pas à autoriser son utilisation en production.

## Exigences
1. Chaque sauvegarde reçoit un identifiant unique et un nonce aléatoire propre à l'opération cryptographique.
2. Les clés sont créées et conservées **hors GitHub, Google Sheets, code client et journaux** dans un gestionnaire de clés approuvé ; permissions minimales, identité serveur vérifiée.
3. La politique de rotation et le moyen de retrouver les anciennes clés pour les restaurations sont définis avant l'activation. Une destruction de clé ne doit jamais rendre les archives légales requises irrécupérables.
4. Le format de stockage doit être versionné et, avant activation d'une rotation, contenir un identifiant de clé non secret et permettre la lecture des anciennes versions.
5. Sauvegarder également les métadonnées de version du schéma, les paramètres de barème et les écritures nécessaires pour reproduire les états financiers.
6. Les restaurations restent conditionnées à l'autorisation de responsables habilités, à la vérification cryptographique et à la recette sur cible isolée.
7. Réaliser une revue de sécurité de l'architecture et des autorisations, des tests de corruption, des tests de reprise après incident et documenter les obligations RGPD.

## État actuel
Le module `WebCryptoAesGcm` fonctionne sur un environnement Web Crypto (test Node). Il prend une `CryptoKey` injectable et n'embarque ni clé réelle ni accès à Drive. L'identifiant de clé, la rotation, le gestionnaire de secrets et un fournisseur de chiffrement compatible Apps Script restent **à développer**.

Aucune connexion aux données réelles de l'UR CFTC Bretagne n'est autorisée par ces composants.
