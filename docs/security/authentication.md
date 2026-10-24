# Authentification et autorisations — décision à prendre

Le rôle transmis par le navigateur **ne constitue jamais une preuve d'identité**. Les cas d'usage du socle prennent un `Actor` à des fins de tests ; il doit être créé côté serveur à partir d'une identité authentifiée par une méthode validée. Il ne faut **jamais** accepter directement un objet `Actor` fourni par l'interface client.

Avant l'accès réel : décider de la stratégie d'identification des élus et mandatés externes, vérifier les limitations d'identité de Google Apps Script, définir les rôles et périmètres, tester les autorisations Drive/Sheets, tracer les décisions et conduire l'analyse RGPD.

Aucun point d'entrée HTTP ou Apps Script accessible publiquement n'est créé à ce stade.
