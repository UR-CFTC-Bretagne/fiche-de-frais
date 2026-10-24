# Fiche de frais — UR CFTC Bretagne

**Projet open source en cours de cadrage et de développement — aucune version exploitable à ce stade.**

Application de dématérialisation des notes de frais pour les mandatés, élus et personnes habilitées de l'Union régionale CFTC Bretagne. L'objectif est de fiabiliser la saisie des frais, leur calcul, la conservation des justificatifs, la validation, le paiement et la ventilation analytique **AGFPN / URB**.

## Fonctionnalités prévues

- **Saisie** : fiche individuelle, motif, réunion ou mandat, identité et code INARIC, lignes de dépenses, itinéraires multi-étapes et covoiturage.
- **Calculs** : indemnités kilométriques, plafonds, frais d'approche, barèmes historiques et règles propres au type de réunion.
- **Justificatifs** : pièces Drive, convocations, présence, frais de transport, repas et hébergement.
- **Workflow** : brouillon, soumission, contrôle, correction, validation, paiement et archivage, avec piste d'audit.
- **Comptabilité analytique** : ventilation des dépenses en AGFPN, URB ou mixte, contrôles d'équilibre, suivi des écritures, exports et rapprochement.
- **Administration et reporting** : référentiels, habilitations, tableaux de bord, exports et sauvegardes.

## Référentiel de travail : fiche UR du 27 avril 2026

Les valeurs suivantes proviennent de la fiche UR et **nécessitent validation formelle avant toute utilisation en production**.

| Poste | Règle figurant dans la fiche |
| --- | --- |
| Train | Seconde classe, sur justificatif |
| Voiture — réunion collective, plus de 2 personnes | 0,50 €/km |
| Voiture — réunion collective, 2 personnes | 0,45 €/km |
| Voiture — réunion collective, conducteur seul | 0,40 €/km, plafond indiqué de 135 € |
| Voiture — réunion paritaire régionale / bureau | 0,50 €/km |
| Hôtel individuel avec petit déjeuner | Jusqu'à 80 €, sur justificatif |
| Frais d'approche des covoiturés | 0,40 €/km au-delà de 10 km, modalités à préciser |

**Contradiction documentaire à arbitrer :** les cases du formulaire indiquent déjeuner 25 € / dîner de la veille 30 €, tandis que les consignes indiquent déjeuner 20 € / dîner 25 €. **Aucune valeur ne doit être codée comme définitive avant décision écrite du trésorier.**

Les réunions remboursées par un organisme extérieur ne doivent pas donner lieu à un double remboursement UR. Le respect des conditions de convocation et de présence doit être contrôlé.

## Architecture cible (non implémentée)

- Monolithe modulaire en **TypeScript**, compilé pour **Google Apps Script**, avec **clasp** et GitHub.
- Interface HTML/CSS/JavaScript ; couche métier indépendante de Google Sheets.
- Adaptateurs **Google Sheets** (stockage initial), **Drive** (pièces et PDF), **Gmail** (notifications), éventuellement Agenda Google et MandatScop.
- Versionnement des règles et barèmes, journalisation des actions, idempotence des paiements et tests automatisés.
- Gestion stricte des accès et des secrets ; possibilité ultérieure de remplacer le stockage.

Il s'agit d'une **architecture envisagée**, pas d'une application déjà développée.

## Gouvernance et backlog

Les spécifications et décisions à valider sont documentées dans le [cahier des charges et plan de projet](https://docs.google.com/document/d/1qKlhH18YekopYN6T-esXCYpDXYtXYtZOybeKINd2mDk/edit). Le [backlog GitHub Issues](https://github.com/UR-CFTC-Bretagne/fiche-de-frais/issues) décline les 10 epics et les User Stories **US-001 à US-075**. Les 65 premières sont définies au niveau de thèmes dans le cahier des charges ; leur découpage détaillé reste une **proposition à affiner lors du refinement**. Les US-066 à US-075 reprennent l'addendum fondé sur la fiche UR.

La feuille de route provisoire couvre le cadrage (sprint 0), le socle technique, la saisie/barèmes, les justificatifs et l'analytique, les validations, les paiements/reportings puis la recette et la sécurité. Dates, responsables et priorités sont à confirmer.

## Sécurité et RGPD

**Ce dépôt est public.** Ne jamais y committer de données de frais réelles, justificatifs, identité de mandaté, code INARIC personnel, RIB, secrets, jetons ou clés d'API. Les notes de frais peuvent révéler une appartenance syndicale. Il faudra faire valider les habilitations, la confidentialité, l'hébergement et les durées de conservation avant tout pilote.

## Licence et attribution

Copyright © 2026 **Union régionale CFTC Bretagne**. Consulter [NOTICE](NOTICE).

L'**Apache License 2.0** a été proposée pour permettre la réutilisation avec conservation des mentions de droits d'auteur et notices lors des redistributions. La licence **n'est pas encore adoptée** et aucun fichier `LICENSE` n'est présent à ce stade. Tant que la licence et la titularité des droits ne sont pas validées, ce dépôt public ne constitue pas une autorisation générale de réutilisation du code.
