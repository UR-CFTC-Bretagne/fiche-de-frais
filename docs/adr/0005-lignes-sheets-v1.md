# ADR-0005 — Persistance versionnée des lignes de frais

**Statut : implémentation prototype, migration réelle non exécutée.**

Le stockage des lignes utilise un onglet distinct \`ExpenseLines\` avec les colonnes :
\`ID | REPORT_ID | KIND | DESCRIPTION_JSON | AMOUNT_CENTS | INCURRED_ON_JSON\`.

La ligne \`EXPENSE_LINE_SCHEMA_VERSION | 1\` doit être ajoutée à l'onglet \`_SchemaMeta\` par une procédure de migration contrôlée. Elle n'écrase pas la version existante \`EXPENSE_REPORT_SCHEMA_VERSION | 1\`.

Les interfaces demeurent séparées : \`ExpenseReportRepository\` pour les dossiers et \`ExpenseLineRepository\` pour les lignes. L'adaptateur est append-only : il refuse les identifiants réutilisés, les données corrompues, les colonnes incompatibles et les versions absentes. Les textes sont sérialisés en JSON pour empêcher leur interprétation comme formules par Google Sheets.

**Limites :** aucune transaction atomique entre notes et lignes, aucune vérification Google des autorisations, aucune migration automatisée, aucun rattachement garanti par clé étrangère Google Sheets. La concurrence entre processus extérieurs au projet Apps Script reste à traiter.

Avant toute recette réelle, créer une copie contrôlée du tableur, tester la restauration et les accès, appliquer la migration sur données fictives, puis vérifier l'intégrité.
