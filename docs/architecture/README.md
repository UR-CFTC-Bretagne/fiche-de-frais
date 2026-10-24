# Architecture de référence

Monolithe modulaire TypeScript adapté à Apps Script : `domain` (règles pures), `application` (cas d'usage et ports), `infrastructure` (API Google), `interface` (UI), `config` (paramétrage). Les dépendances vont de l'extérieur vers le domaine.

Déploiement Google Apps Script : le point d'entrée, l'assemblage, la compilation compatible V8 et le pipeline clasp restent à réaliser. Le dépôt n'est pas déployable en l'état.
