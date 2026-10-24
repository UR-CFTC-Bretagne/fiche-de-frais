# ADR-0003 — Contrôle de version des données Google Sheets

**Statut : convention technique adoptée, mise en production non autorisée**

## Contexte
Les notes de frais sont des données comptables sensibles. Les évolutions du schéma ne doivent pas dégrader les écritures passées ni modifier les règles financières applicables lors d'une dépense.

## Décision
- Chaque tableur de l'application possédera un onglet `_SchemaMeta` avec deux colonnes `KEY` et `VALUE` et une ligne `EXPENSE_REPORT_SCHEMA_VERSION | 1`.
- En cas d'absence de version, de doublon ou de version future, **arrêt explicite** de l'adaptateur : aucune réparation silencieuse.
- Le schéma des brouillons V1 conserve les en-têtes `ID, CLAIMANT_ID_JSON, FISCAL_YEAR, PURPOSE_JSON, STATUS, CREATED_AT_JSON`.
- Les changements nécessitent un numéro de version, une migration idempotente et testée, une sauvegarde contrôlée, un contrôle d'intégrité, une procédure de retour arrière et une autorisation formalisée.
- Aucun script de migration destructrice ou automatique n'est déployé dans cette première phase.

## Limites
Le contrôle est prêt pour le pilote, mais aucune sauvegarde/restauration réelle n'est encore implémentée. Les contrats de stockage sont adaptés à la **création de brouillons uniquement**. La modification de notes existantes nécessitera une évolution versionnée et une stratégie de concurrence optimiste.

## Recette préalable à une mise en production
Tests avec données entièrement fictives, droits d'accès vérifiés, vérification des en-têtes et versions, sauvegarde et restauration constatées, rapprochement des totaux comptables.
