# Recette intégrée des sauvegardes — environnement isolé

La suite `tests/integration/backup-drive-roundtrip.test.ts` valide avec des **données fictives** la chaîne suivante :

1. génération d'un manifeste et d'une archive, calcul de SHA-256 ;
2. chiffrement AES-256-GCM avec une clé éphémère générée pour le test ;
3. sérialisation d'un conteneur chiffré dans une passerelle Drive simulée en mémoire ;
4. lecture du conteneur, déchiffrement et contrôle de l'intégrité de l'archive ;
5. restauration dans une cible mémoire vide et comparaison de toutes les lignes et du total ;
6. refus d'une altération de ciphertext, d'une restauration non autorisée et d'une seconde restauration sur cible occupée.

Les données et la clé ne sont ni publiées sur GitHub ni envoyées à Drive.

## Ce qui n'est pas couvert

- La capacité réelle à écrire sur un Drive Google sécurisé et les restrictions effectives des droits.
- Le chiffrement compatible avec l'environnement Apps Script, la gestion et la rotation de clés.
- L'atomicité des opérations Google Drive ou Google Sheets, la restauration transactionnelle réelle.
- Les contrôles RGPD, le suivi d'audit, la politique de rétention et la restauration après incident d'exploitation.

Cette recette ne constitue donc pas une validation de production. Voir aussi [conditions préalables Drive](drive-archives-prerequis.md).
