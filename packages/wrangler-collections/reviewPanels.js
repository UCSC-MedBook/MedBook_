// var ignoredGenesPanel = {
//   name: "ignored_genes",
//   title: "Invalid genes",
//   description: "The following genes are not valid HUGO genes and will be not be imported.",
//   css_class: "panel-danger",
//   columns: [
//     { heading: "Gene", attribute: "gene" },
//   ],
// };

// var mappedGenesNoDescription = {
//   name: "mapped_genes",
//   title: "Mapped genes",
//   css_class: "panel-default",
//   columns: [
//     { heading: "Gene in file", attribute: "gene_in_file" },
//     { heading: "MedBook gene name", attribute: "mapped_gene" },
//   ],
// };

// var newClinicalData = {
//   name: "new_clinical_data",
//   title: "New clinical data",
//   description: "Medbook does not have clinical information for the " +
//       "following samples/patients. Clinical_Info and the " +
//       "studies collection will be updated include them.",
//   css_class: "panel-danger",
//   columns: [
//     { heading: "Study", attribute: "study_label" },
//     { heading: "Patient ID", attribute: "patient_label" },
//     { heading: "Sample ID", attribute: "sample_label" },
//   ],
// };

Wrangler.reviewPanels = {
  genomic_expression: [
    {
      name: "assay_sample_summary",
      title: "Sample summary",
      css_class: "panel-default",
      columns: [
        {
          heading: "Sample label",
          attribute: "sample_label",
          header_of_row: true
        },
        { heading: "Data set", attribute: "data_set_name" },
        { heading: "Gene count", attribute: "line_count" },
      ],
    }
  ],
  // isoform_expression: [
  //   assaySampleSummary("Isoform count"),
  //   // newClinicalData,
  //   sampleDataExists,
  //   // _.extend(mappedGenesNoDescription, {
  //   //   description: "After mapping from transcript ID to gene name, these " +
  //   //       "genes will be renamed for consistancy within MedBook.",
  //   // }),
  // ],
  // network: [
  //   {
  //     name: "new_network",
  //     title: "New networks",
  //     description: "I need to write a description",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Network name", attribute: "name", header_of_row: true },
  //       { heading: "Version", attribute: "version" },
  //       { heading: "File name", attribute: "file_name" },
  //     ],
  //   },
  //   {
  //     name: "source_level_interactions",
  //     title: "Gene interactions",
  //     description: "I need to write a description",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Source gene", attribute: "source_label", header_of_row: true },
  //       { heading: "Target count", attribute: "target_count" },
  //       { heading: "Minimum weight", attribute: "min_weight" },
  //       { heading: "Maximum weight", attribute: "max_weight" },
  //       { heading: "Average weight", attribute: "mean_weight" },
  //       { heading: "Network name", attribute: "network_name" },
  //       { heading: "Network version", attribute: "network_version" },
  //     ],
  //   },
  //   // ignoredGenesPanel,
  //   // _.extend(mappedGenesNoDescription, {
  //   //   description: "These genes are valid but are going to be mapped " +
  //   //       "into MedBook gene namespace."
  //   // }),
  // ],
  // contrast: [
  //   {
  //     name: "contrast_summary",
  //     title: "Contrasts",
  //     description: "These contrasts will be inserted/updated.",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Contrast name", attribute: "contrast_label" },
  //       { heading: "Version", attribute: "contrast_version" },
  //       { heading: "Description", attribute: "description" },
  //       { heading: "Group A name", attribute: "a_name" },
  //       { heading: "Group A sample count", attribute: "a_samples_count" },
  //       { heading: "Group B name", attribute: "b_name" },
  //       { heading: "Group B sample count", attribute: "b_samples_count" },
  //     ],
  //   },
  //   {
  //     name: "contrast_sample",
  //     title: "Contrasts data",
  //     description: "Contrast group assignments",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Contrast name", attribute: "contrast_label" },
  //       { heading: "Version", attribute: "contrast_version" },
  //       { heading: "Study", attribute: "study_label" },
  //       { heading: "Sample ID", attribute: "sample_label" },
  //       { heading: "Group", attribute: "group_name" },
  //     ],
  //   },
  //   // newClinicalData,
  // ],
  // signature: [
  //   {
  //     name: "signature_summary",
  //     title: "Signatures",
  //     description: "These signatures will be inserted/updated.",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Signature name", attribute: "signature_label" },
  //       { heading: "Version", attribute: "signature_version" },
  //       { heading: "Description", attribute: "description" },
  //       { heading: "Algorithm", attribute: "algorithm" },
  //       { heading: "Features type", attribute: "features_type" },
  //     ],
  //   },
  //   {
  //     name: "feature_summary",
  //     title: "Features",
  //     description: "List of features with their corresponding values",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Signature name", attribute: "signature_label" },
  //       { heading: "Version", attribute: "signature_version" },
  //       { heading: "Feature", attribute: "feature_label" },
  //       { heading: "Value", attribute: "value" },
  //       { heading: "P-value", attribute: "p_value" },
  //       { heading: "FDR", attribute: "false_discovery_rate" },
  //     ],
  //   },
  // ],
  // mutation: [
  //   {
  //     name: "mutation_summary",
  //     title: "Mutations",
  //     description: "These mutation documents will be loaded",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Sample ID", attribute: "sample_label" },
  //       { heading: "Mutation count", attribute: "mutation_count" },
  //     ],
  //   },
  // ],
  // metadata: [
  //   {
  //     name: "patient_sample_map",
  //     title: "Patient sample mapping",
  //     description: "The following patient sample mappings will be created.",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Study", attribute: "study_label" },
  //       { heading: "Patient", attribute: "patient_label" },
  //       { heading: "Sample", attribute: "sample_label" },
  //       { heading: "Change", attribute: "change_description" },
  //     ],
  //   },
  //   {
  //     name: "new_sample_label",
  //     title: "New sample ID",
  //     description: "The following sample IDs will be added.",
  //     css_class: "panel-default",
  //     columns: [
  //       { heading: "Study", attribute: "study_label" },
  //       { heading: "Sample", attribute: "sample_label" },
  //     ],
  //   },
  // ],
  gene_set_collection: [
    {
      name: "new_gene_set_collection",
      title: "Gene sets",
      description: "The following gene set collections will be imported",
      css_class: "panel-default",
      columns: [
        { heading: "Name", attribute: "name" },
        { heading: "Description", attribute: "description" },
        { heading: "Gene set count", attribute: "gene_set_count" },
      ],
    }
  ],
  clinical: [
    {
      name: "form_definition",
      title: "Forms",
      description: "The following forms will be created.",
      css_class: "panel-default",
      columns: [
        { heading: "Form name", attribute: "form_name" },
        { heading: "Record count", attribute: "record_count" },
      ],
    },
    {
      name: "field_definition",
      title: "Fields",
      description: "The following fields were found.",
      css_class: "panel-default",
      columns: [
        { heading: "Form name", attribute: "form_name" },
        { heading: "Field name", attribute: "field_name" },
        { heading: "Field value type", attribute: "value_type" },
      ],
    },
  ],
  metadata: [
    {
      name: "sample_label_definition",
      title: "Sample label definitions",
      description: "The following sample label definitions will be loaded.",
      css_class: "panel-default",
      columns: [
        { heading: "Study", attribute: "study_name" },
        { heading: "New sample labels", attribute: "new_sample_label_count" },
        {
          heading: "Existing sample labels",
          attribute: "existing_sample_label_count"
        },
      ],
    }
  ]
};
