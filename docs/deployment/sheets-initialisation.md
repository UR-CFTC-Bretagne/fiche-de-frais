# Tableur de recette — préparation manuelle

**Aucune connexion réelle n'est activée par défaut.** La création d'un tableur Google Sheets, sa localisation Drive, ses administrateurs et sa durée de conservation doivent être validés avec l'UR CFTC Bretagne.

L'adaptateur pilote utilise un onglet nommé `ExpenseReports` et exactement six colonnes, dans cet ordre :

`ID | CLAIMANT_ID_JSON | FISCAL_YEAR | PURPOSE_JSON | STATUS | CREATED_AT_JSON`

Les champs texte sont stockés sous la forme de chaînes JSON pour éviter qu'une saisie ne soit évaluée comme formule.

Le dépôt contient `AppsScriptSheetGateway` mais ne fournit pas encore de point d'entrée HTTP, ni d'authentification ; il ne doit **pas** être exposé publiquement. Le verrou du script protège l'opération de contrôle et d'ajout si toutes les écritures de cette application utilisent le même projet Apps Script. Cela n'empêche pas un utilisateur ayant directement accès en écriture au tableur de modifier les données ; l'accès direct doit donc être limité.

Ce prototype gère uniquement la création et la lecture de brouillons ; la modification avec version, l'audit, la suppression, la restauration et le rapprochement comptable restent à développer. Aucun traitement AGFPN ne doit être considéré comme validé par cet adaptateur.
