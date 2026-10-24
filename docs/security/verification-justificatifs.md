# Vérification des justificatifs avant référencement

Le composant `RegisterVerifiedAttachment` lit les octets depuis un `PrivateAttachmentReader` côté serveur, avec un identifiant de propriétaire issu d'une identité **déjà vérifiée**. Il contrôle la taille, les signatures minimales PDF/PNG/JPEG et recalcule l'empreinte SHA-256, puis délègue l'enregistrement des métadonnées à `RegisterAttachment`.

Ces contrôles de signature sont **élémentaires** et ne constituent ni une analyse antivirus ni une preuve qu'un document est authentique, non dangereux ou conforme. Le lecteur privé doit démontrer l'appartenance du fichier à l'utilisateur autorisé, la restriction des permissions et l'absence de substitution entre vérification et enregistrement. Les PDF actifs, formats polyglottes, images malveillantes, quotas et limites mémoire nécessitent une revue spécifique.

La méthode existante `RegisterAttachment` accepte toujours des métadonnées fournies par son appelant ; elle ne doit donc **pas être exposée directement à une interface publique**. Seule une façade de confiance pourra utiliser `RegisterVerifiedAttachment` après authentification côté serveur.

Aucun accès réel à Google Drive, aucun antivirus ni stockage de fichier n'est déployé. Les tests utilisent uniquement des octets fictifs.
