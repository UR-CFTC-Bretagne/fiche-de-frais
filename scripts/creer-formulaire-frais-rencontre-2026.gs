/**
 * Créer UNE FOIS un brouillon de Google Form dans le compte UR.
 * Ne publie pas le formulaire et ne crée aucun déclencheur.
 * Vérifier les champs et ajouter manuellement « Importer un fichier ».
 */
function creerFicheFraisRencontre2026() {
  const titre = 'CFTC Bretagne — Frais de déplacement — Rencontre des mandatés du 2 novembre 2026';
  const form = FormApp.create(titre);
  form.setDescription(
    'Rencontre des mandatés CFTC Bretagne — lundi 2 novembre 2026, 9 h–16 h, ' +
    'Harmonie Mutuelle à Rennes. Une demande par participant. Indiquez les frais réels engagés. ' +
    'Les montants seront vérifiés selon les règles de l’UR CFTC Bretagne. ' +
    'Les justificatifs doivent être transmis ; aucune prise en charge automatique n’est garantie.'
  );
  form.setConfirmationMessage('Votre demande a été transmise pour vérification. Conservez vos justificatifs originaux.');
  form.setCollectEmail(true);
  form.setAcceptingResponses(false);
  const text = (title, required) => form.addTextItem().setTitle(title).setRequired(required);
  const paragraph = title => form.addParagraphTextItem().setTitle(title);
  const choice = (title, values, required) =>
    form.addMultipleChoiceItem().setTitle(title).setChoiceValues(values).setRequired(required);
  const section = title => form.addSectionHeaderItem().setTitle(title);
  section('1 — Identité du demandeur');
  text('Nom', true);
  text('Prénom', true);
  text('Code INARIC', true);
  text('Adresse postale', true);
  text('Téléphone', false);
  section('2 — Déplacement du 2 novembre 2026');
  text('Ville de départ', true);
  text('Adresse ou lieu de départ', false);
  paragraph('Trajet aller et retour, étapes éventuelles et détours');
  choice('Transport principal', ['Train (2e classe)', 'Voiture personnelle', 'Covoiturage conducteur', 'Covoiturage passager', 'Transports en commun', 'Autre'], true);
  text('Kilométrage total aller-retour en voiture (km, si concerné)', false);
  paragraph('Covoiturage : noms des passagers, lieux de prise en charge et éventuels détours');
  choice('Un autre organisme prend-il en charge tout ou partie de ces frais ?', ['Non', 'Oui', 'À vérifier'], true);
  section('3 — Frais réellement engagés (euros)');
  text('Billets de train ou transports en commun (€)', false);
  text('Stationnement (€)', false);
  text('Péages (€)', false);
  text('Repas non fourni par l’organisateur (€)', false);
  text('Hébergement autorisé, le cas échéant (€)', false);
  text('Autres frais (€)', false);
  paragraph('Précisions utiles sur les dépenses ou les montants');
  section('4 — Justificatifs');
  paragraph('Liste des justificatifs disponibles (billets, factures, itinéraire, etc.)');
  section('5 — Déclaration du demandeur');
  form.addCheckboxItem().setTitle('Attestation').setChoiceValues([
    'Je certifie l’exactitude des informations et déclare ne pas avoir sollicité un double remboursement pour les mêmes frais.'
  ]).setRequired(true);
  Logger.log('Modifier le formulaire : ' + form.getEditUrl());
  Logger.log('Lien à diffuser après vérification et activation : ' + form.getPublishedUrl());
  Logger.log('IMPORTANT : ajouter manuellement une question Importer un fichier, vérifier la politique de confidentialité et les accès.');
}
