# ADR-0002 — Frontières architecturales contrôlées automatiquement

**Statut : adopté comme convention de développement (sans validation de mise en production)**

## Décision
Conserver un monolithe modulaire utilisant l'inversion des dépendances :
- le `domain` ne dépend d'aucune API externe ;
- `application` dépend du domaine et de ses ports, jamais d'un adaptateur concret ;
- `infrastructure` implémente les ports ;
- `interface` orchestre les cas d'usage sans appliquer des règles financières différentes.

Un contrôle de frontières s'exécute dans la CI. Les modèles comptables et les barèmes restent versionnés ; les connexions Google sont remplaçables.

## Compromis
Ce découpage ajoute quelques interfaces et tests, mais réduit les risques de régression et permet une maintenance par plusieurs contributeurs. Les exceptions architecturales doivent être justifiées par une ADR distincte.

Voir [principes-maintenance.md](../architecture/principes-maintenance.md).
