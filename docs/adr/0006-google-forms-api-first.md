# ADR-0006 — Google Forms comme saisie, contrats métier API-first

**Statut : décision retenue pour le MVP ; intégration Google Forms réelle non activée.**

- Google Forms reste l'interface de saisie.
- Apps Script reçoit l'événement de soumission **installable côté serveur**, depuis le formulaire de confiance.
- La transformation des champs est fondée sur les **identifiants d'items**, et non leurs libellés.
- L'identité métier est déterminée par une authentification vérifiée côté serveur et des habilitations : **ne jamais considérer l'adresse de réponse Forms ou un champ rempli comme preuve d'identité**.
- Les entrées passent par des contrats TypeScript versionnables puis les cas d'usage. Google Sheets et Drive sont des adaptateurs privés remplaçables.
- Une réponse doit être traitée de façon idempotente et durable, avec suivi des erreurs et reprise. Le registre en mémoire fourni ici ne vaut que pour les tests.
- Ne pas activer le déclencheur avant une preuve de liaison entre réponse Forms, utilisateur authentifié et droit de soumission.

Le MVP n'expose **aucune API REST publique**. Le contrat interne facilite une future API sans ajout d'un nouveau serveur à ce stade. Les justificatifs, corrections et validations devront faire l'objet d'un parcours distinct et sécurisé.
