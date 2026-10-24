# Prototype de restauration sur données fictives

Le flux `RestoreWorkflow` valide une archive grâce à son empreinte SHA-256, sa version et une autorisation explicite avant de transmettre son contenu à une cible `RestoreTarget`.

L'implémentation `InMemoryRestoreTarget` réalise une affectation atomique en mémoire. Elle refuse un second chargement et préserve les données existantes. Les tests couvrent une archive saine, un second chargement, une autorisation absente, une archive altérée et un schéma incompatible.

**Limites de sécurité :**
- La cible mémoire n'est pas une base de données et ne représente pas une transaction Sheets.
- Un futur adaptateur de restauration Google Sheets devra verrouiller le contrôle de vacuité et l'écriture, vérifier l'intégrité après écriture et produire un journal d'audit.
- Les archives actuelles ne sont pas chiffrées ; aucune connexion Drive ou donnée personnelle ne peut être utilisée.
- L'approbation n'est qu'un objet de test. L'identité et les permissions réelles doivent être établies côté serveur.
- Aucun export ni import de production n'est autorisé.

Voir [ADR-0004](../adr/0004-sauvegarde-restauration.md).
