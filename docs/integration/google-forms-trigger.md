# Événement Google Forms — contrat de déclenchement

Le MVP reste basé sur Google Forms, Google Apps Script, Sheets et Drive. Un déclencheur **installable attaché au formulaire**, et non à la feuille des réponses, doit alimenter `normalizeFormSubmitEvent`. Les champs métier utilisent les identifiants stables des questions.

Le connecteur `FormSubmissionHandler` n'accepte une soumission que si un composant serveur `TrustedFormActorResolver` fournit un acteur actif habilité. **Aucun fournisseur d'identité réel n'est encore connecté**. L'adresse fournie par Google Forms et les champs du formulaire ne suffisent pas à garantir que l'utilisateur est le mandaté concerné. Le déclencheur n'est pas installé ni exécuté sur une donnée réelle.

L'idempotence fournie par `InMemoryFormSubmissionRegistry` est uniquement destinée aux tests : elle ne résiste pas aux redémarrages ni aux processus distincts. Un journal de soumissions durable et une stratégie de reprise après écriture partielle seront nécessaires avant activation. Les déclencheurs Apps Script s'exécutent sous l'identité de leur créateur : vérifier impérativement les privilèges et les autorisations de ce compte.

Les erreurs de soumission doivent conduire à un traitement de reprise contrôlé sans divulgation de données personnelles dans les journaux.
