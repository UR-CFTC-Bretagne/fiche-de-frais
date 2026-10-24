# Authentification et habilitations — frontière de confiance

## Principe
L'application n'accepte **jamais** un rôle ni un identifiant d'utilisateur provenant d'un formulaire, d'une requête JSON ou d'un paramètre d'URL. Toute opération doit d'abord passer par une résolution d'identité serveur et une consultation du registre d'habilitations.

## Contrats ajoutés
- `TrustedIdentityProvider<Context>` : vérifie l'identité dans un contexte technique produit côté serveur.
- `MembershipDirectory` : fournit des rôles et un état actif à partir d'un référentiel administré distinctement des demandeurs.
- `ResolveServerActor` : rejette par défaut toute identité absente, fournisseur inconnu ou habilitation désactivée.
- `ExpenseReportService` : appelle les cas d'usage existants après résolution, sans recevoir directement un objet `Actor` du navigateur.

Les tests utilisent un faux fournisseur d'identité et des usagers fictifs. **Aucun fournisseur réel n'est branché** et la vérification d'un faux objet `VerifiedPrincipal` ne serait pas suffisante pour la production.

## Décisions avant mise en service
1. Choisir un fournisseur d'identité compatible avec les mandatés disposant d'adresses personnelles ou d'organisations différentes ; vérifier la preuve cryptographique du jeton et sa durée de validité.
2. Définir les administrateurs du registre d'habilitations et les périmètres d'accès du trésorier, des réviseurs et des auditeurs ; séparation des tâches.
3. Vérifier le comportement de `Session.getActiveUser()` en Apps Script selon le mode de déploiement : une adresse vide n'est jamais une identité vérifiée.
4. Garantir que le contexte d'authentification ne peut être construit que par une frontière serveur ; mettre en place une journalisation minimale non sensible.
5. Prévoir la révocation immédiate, les tests d'accès croisés et la validation RGPD.

Aucun endpoint public, aucun rôle de production ni aucune connexion au registre réel des mandatés n'ont été activés.
