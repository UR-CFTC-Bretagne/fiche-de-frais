# Première étape : Google Forms vers JSON

Une réponse Google Forms est transformée en un objet JSON versionné avec `schemaVersion`, `source`, `formId`, `responseId` et `answers`. Les clés de `answers` correspondent aux identifiants stables des questions, et non aux intitulés visibles. Le convertisseur accepte le texte et les listes de textes ; il refuse les objets et les doublons.

Le code est actuellement une bibliothèque testée avec données fictives. Il ne crée pas de note de frais, ne déclenche pas un traitement automatique, ne stocke pas le JSON et ne prouve pas l'identité du répondant. Le branchement au déclencheur installable Forms et le choix d'un stockage privé restent à réaliser. Ne pas publier les réponses dans GitHub ou les logs.
