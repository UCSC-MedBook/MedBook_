Package.describe({
  name: 'medbook:wrangler-collections',
  version: '0.0.24',
  // Brief, one-line summary of the package.
  summary: "Collections and import adapters for Wrangler",
  // URL to the Git repository containing the source code for this package.
  git: "https://github.com/UCSC-MedBook/MedBook-wrangler-collections",
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: null
});

Npm.depends({"binary-search": "1.2.0"});

Package.onUse(function(api) {
  api.versionsFrom("1.1.0.3");

  api.use("accounts-base@1.2.0");
  api.use("underscore");
  api.use("aldeed:simple-schema@1.3.3");
  api.use("aldeed:autoform@5.5.1");
  api.use("mokolodi1:helpers@0.0.3");
  api.use("medbook:primary-collections@0.0.19");
  api.use("medbook:referential-integrity@0.0.2");

  // the definitions are loaded first so that indexes can be ensured in
  // the file handlers
  api.addFiles("wranglerCollectionsDefinitions.js");
  api.export("WranglerSubmissions");
  api.export("WranglerDocuments");
  api.export("WranglerFiles");

  api.addFiles([
    "fileHandlers/globals.js",
    "fileHandlers/FileHandler.js",
    "fileHandlers/TabSeperatedFile.js",
    "fileHandlers/RectangularGeneAssay.js",

    "fileHandlers/RectGenomicExpression.js",
    // "fileHandlers/RectangularGeneAnnotation.js",
    // "fileHandlers/RectangularIsoformExpression.js",
    "fileHandlers/PatientSampleMapping.js",
    "fileHandlers/SampleLabelDefinition.js",
    // "fileHandlers/ContrastMatrix.js",
    // "fileHandlers/LimmaSignature.js",
    // "fileHandlers/MutationVCF.js",
    // "fileHandlers/ArachneRegulon.js", // not ready yet

    "fileHandlers/GeneSetGroup.js",
    "fileHandlers/ClinicalForm.js",

    // Admin stuff
    "fileHandlers/HGNCGeneList.js",
    "fileHandlers/GeneTranscriptMappings.js",
  ], "server");
  api.export("WranglerFileHandlers", "server");

  api.addFiles("Wrangler.js");
  api.addFiles("reviewPanels.js");
  api.export("Wrangler");

  api.addFiles("wranglerCollectionsSchemas.js");
});

Package.onTest(function(api) {
  api.use("tinytest");
  api.use("medbook:wrangler-collections");
  api.addFiles("wrangler-collections-tests.js");
});
