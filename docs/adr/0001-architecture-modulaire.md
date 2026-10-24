# ADR-0001 — Architecture modulaire TypeScript

**Statut : proposé — 24 octobre 2026**

## Contexte

Le projet doit prendre en charge des règles de remboursement et d'analytique auditables sans couplage direct à Sheets.

## Proposition

Séparer `domain`, `application`, `infrastructure` et `interface` ; faire dépendre les adaptateurs des ports, pas l'inverse. Utiliser TypeScript et des tests unitaires indépendants d'Apps Script.

## Conséquences

Évolution facilitée des règles et du stockage, au prix d'un processus de compilation et de déploiement à mettre en place.

**Validation métier et technique requise avant mise en production.**
