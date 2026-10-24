# Lignes de frais — première implémentation du modèle README

Le modèle de données documenté dans le README est décliné en un premier cas d'usage : `AddExpenseLine`.

## Éléments réalisés
- Contrôle de l'identifiant, du rattachement à la note, du type de dépense, du libellé, de la date civile ISO et du montant en centimes entiers sûrs.
- Calcul exact du total des lignes, refus des doublons et du dépassement des entiers sûrs.
- Ajout autorisé uniquement au propriétaire actif ayant le rôle `CLAIMANT`, sur une note à l'état `DRAFT`.
- Contrat de persistance `ExpenseLineRepository` et adaptateur de test en mémoire.

## Non implémenté
- Aucun stockage réel des lignes dans Google Sheets ; versionnement de schéma et migration nécessaires avant introduction.
- Aucun barème, plafond ou éligibilité présumé. Les tarifs repas doivent toujours faire l'objet de l'arbitrage écrit.
- Le cas d'usage ne bénéficie pas encore d'une transaction atomique inter-repositories : la concurrence doit être sécurisée avant production.
- Les objets `Actor` sont des paramètres du cas d'usage ; l'entrée externe doit passer par la façade de résolution d'identité serveur et une politique d'accès vérifiée.

Toutes les données des tests sont fictives.
