let Future = Npm.require('fibers/future');

Meteor.methods({
  // Starts a new job with the given args. If a job already exists with
  // the given args, it instead returns the _id of that duplicate job.
  createUpDownGenes: function (formValues, customSampleGroup) {
    check(formValues, new SimpleSchema({
      data_set_or_patient_id: { type: String, label: "Data set or patient" },
      sample_label: { type: String, label: "Sample" },
      sample_group_id: { type: String, label: "Sample group" },
      iqr_multiplier: { type: Number, decimal: true },
      use_filtered_sample_group: {type: Boolean },
    }));
    check(customSampleGroup, Object);

    let user = MedBook.ensureUser(Meteor.userId());

    let {
      data_set_or_patient_id,
      sample_label,
      sample_group_id,
      iqr_multiplier,
      use_filtered_sample_group,
    } = formValues;

    // if we need to create a new sample group, do so
    if (formValues.sample_group_id === "creating") {
      this.unblock();

      let creatingError;
      Meteor.call("createSampleGroup", customSampleGroup, (err, ret) => {
        // NOTE: this callback is executed before the Meteor.call returns

        creatingError = err;
        sample_group_id = ret;
      });

      // if there was a problem with that one, throw the associated error
      if (creatingError) throw creatingError;
    }

    // security for the sample group
    let sampleGroup = SampleGroups.findOne(sample_group_id);
    user.ensureAccess(sampleGroup);

    let args = {
      sample_label,
      iqr_multiplier,
      sample_group_id,
      sample_group_name: sampleGroup.name,
      use_filtered_sample_group,
    };

    // set args.data_set_id and args.data_set_name_or_patient_label
    if (data_set_or_patient_id.startsWith("patient-")) {
      let patientId = data_set_or_patient_id.slice("patient-".length);
      let patient = Patients.findOne(patientId);
      let sample = _.findWhere(patient.samples, { sample_label });

      args.data_set_id = sample.data_set_id;
      args.data_set_name_or_patient_label = patient.patient_label;

      user.ensureAccess(patient);
    } else if (data_set_or_patient_id.startsWith("data_set-")) {
      args.data_set_id = data_set_or_patient_id.slice("data_set-".length);

      let dataSet = DataSets.findOne(args.data_set_id);
      args.data_set_name_or_patient_label = dataSet.name;

      user.ensureAccess(dataSet);
    }

    console.log("staring oa job with args", args); // XXX 


    // check to see if a job like this one has already been run,
    // and if so, return that job's _id
    // NOTE: I believe there could be a race condition here, but
    // I don't think Meteor handles more than one Meteor method at once.
    // NOTE 2: if there is a job that predates sample group filters,
    // that job will never be found as a duplicate here as the args have changed.
    // TODO is that the case? or do the args let us find them?
    let duplicateJob = Jobs.findOne({
      args,
      collaborations: user.getCollaborations()
    });
    if (duplicateJob) {
      console.log("found duplicate job", duplicateJob._id) // XXX
      return duplicateJob._id;
    }


    // If this job uses the gene filters on the sample group,
    // and they're not already generated,
    // queue a job to generate them and set it as a prerequisite
    // for the outlier analysis job.
    let prerequisite_job_ids = [];
    if(use_filtered_sample_group){
      console.log("lookin for samplegroup filter"); // XXX
      // check the sample group for a gene-filter blob
      let foundFilter = Blobs2.findOne({
        "associated_object.collection_name":"SampleGroups",
        "associated_object.mongo_id":sample_group_id,
        "metadata.type":"ExprAndVarFilteredSampleGroupData",
      });
      if(!foundFilter){
        console.log("didn't find filter, pushing new job"); // XXX
        // No existing filters -- queue a new job to create them
        prerequisite_job_ids.push(Jobs.insert({
          name: "ApplyExprAndVarianceFilters",
          status: "waiting",
          user_id: user._id,
          collaborations: [ user.personalCollaboration() ],
          args: {"sample_group_id":sample_group_id},
        }));  
      }
    } 

    console.log("prerequiste IDS are", prerequisite_job_ids); //XXX


    return Jobs.insert({
      name: "UpDownGenes",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args,
      prerequisite_job_ids,
    });
  },
  createSampleGroup: function (sampleGroup) {
    // NOTE: this method might produce "unclean" errors because I don't
    // feel like rewriting most of the schema for SampleGroups for the
    // check function (above)
    check(sampleGroup, Object);

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(sampleGroup);

    // sanity checks (complete with nice error messages)
    if (!sampleGroup.name) {
      throw new Meteor.Error("name-missing", "Name missing",
          "Please name your sample group.");
    }
    if (sampleGroup.data_sets.length === 0) {
      throw new Meteor.Error("no-data-sets", "No data sets",
          "Please add at least one data set to your sample group.");
    }

    // make sure the version is correct (aka don't trust the user)
    // TODO: when should we increment the version?
    // What if the samples are the same?
    sampleGroup.version =
        Meteor.call("getSampleGroupVersion", sampleGroup.name);

    // ensure uniqueness for data sets
    let uniqueDataSets = _.uniq(_.pluck(sampleGroup.data_sets, "_id"));
    if (uniqueDataSets.length !== sampleGroup.data_sets.length) {
      throw new Meteor.Error("non-unique-data-sets");
    }

    // filter through each data set
    sampleGroup.data_sets = _.map(sampleGroup.data_sets,
        (sampleGroupDataSet) => {
      // ensure access
      let dataSet = DataSets.findOne(sampleGroupDataSet.data_set_id);
      user.ensureAccess(dataSet);

      // make sure they're all the same type
      if (!sampleGroup.value_type) {
        // infer from the data sets for now
        sampleGroup.value_type = dataSet.value_type;
      }

      if (dataSet.value_type !== sampleGroup.value_type) {
        throw new Meteor.Error("mixed-value-types", "Mixed value types",
            "You can only create a sample group with data sets " +
            "of a single value type.");
      }

      // don't trust the client's name or unfiltered count
      sampleGroupDataSet.data_set_name = dataSet.name;
      sampleGroupDataSet.unfiltered_sample_count = dataSet.sample_labels.length;

      // Apply the sample group's filters.
      // We start with all the sample labels in a data set.
      // Then, apply filters as follows.
      // -  Filter by form values: Run the passed query in mongo and remove all samples
      //    that are not included in the query results
      // -  Include Specific Samples : remove all samples NOT on the include list
      // -  Exclude Specific Samples : remove all samples on the exclude list
      let allSamples = dataSet.sample_labels;
      let sample_labels = allSamples; // need a copy of this
  

      _.each(sampleGroupDataSet.filters, (filter) => {
        let { options } = filter;
  
        if (filter.type === "form_values"){
          // Run the mongo_query
          // Get the result sample labels synchronously
          let result_sample_labels = Meteor.call('getSamplesFromFormFilter', 
            sampleGroupDataSet.data_set_id,
            options.mongo_query,
            options.form_id
          );

          console.log("Query found", result_sample_labels.length, "sample labels.");

          sample_labels = _.intersection(sample_labels, result_sample_labels);

        } else if (filter.type === "include_sample_list") {
          if (_.difference(options.sample_labels, allSamples).length) {
            throw new Meteor.Error("invalid-sample-labels");
          }
          sample_labels = _.intersection(sample_labels, options.sample_labels);
        } else if (filter.type === "exclude_sample_list") {
          if (_.difference(options.sample_labels, allSamples).length) {
            throw new Meteor.Error("invalid-sample-labels");
          }
          sample_labels = _.difference(sample_labels, options.sample_labels);
        } else {
          throw new Meteor.Error("invalid-filter-type");
        }
      });

      if (sample_labels.length === 0) {
        throw new Meteor.Error("data-set-empty", "Data set empty",
            `The ${dataSet.name} data set is empty. ` +
            "Remove filters or remove the data set to continue.");
      }

      sampleGroupDataSet.sample_labels = sample_labels;

      return sampleGroupDataSet; // NOTE: _.map at beginning
    });

    // We can't use the regular SampleGroups.insert because SimpleSchema can't
    // handle inserting objects with very large arrays (ex. sample_labels).
    // Instead, handle the autoValues and check the schema manually...

    // check to make sure sample_labels are valid in actual sample group
    // (not done below because SimpleSchema hangs)
    _.each(sampleGroup.data_sets, (dataSet) => {
      check(dataSet.sample_labels, [String]);

      dataSet.sample_count = dataSet.sample_labels.length;
      check(dataSet.sample_count, Number);

      // Confirm the filter options (include / exclude sample list only)
      _.each(dataSet.filters, (filter) => {
        if((filter.type === "include_sample_list")||(filter.type === "exclude_sample_list")){
          check(filter.options.sample_labels, [String]);
          filter.options.sample_count = filter.options.sample_labels.length;
        }
      });
    });

    // clone object to be checked for the schema
    let clonedSampleGroup = JSON.parse(JSON.stringify(sampleGroup));
    _.each(clonedSampleGroup.data_sets, (dataSet) => {
      // SimpleSchema can't handle large arrays, so set this to one
      dataSet.sample_labels = [ "yop" ];
      dataSet.sample_count = 1;
    });

    let validationContext = SampleGroups.simpleSchema().newContext();
    var isValid = validationContext.validate(clonedSampleGroup);
    if (!isValid) {
      console.log("clonedSampleGroup:", clonedSampleGroup);
      console.log("validationContext.invalidKeys():",
          validationContext.invalidKeys());
      throw new Meteor.Error("invalid-sample-group");
    }

    sampleGroup.date_created = new Date();
    let newId = Random.id(); // XXX: might cause collisions
    sampleGroup._id = newId;

    // insert asynchronously -- thanks @ArnaudGallardo
    var future = new Future();
    SampleGroups.rawCollection().insert(sampleGroup, (err, insertedObj) => {
      // Need to either throw err, or return ID, but NOT BOTH 
      // or will crash with "Future resolved more than once" error 
      if (err) {
       console.log("Creating sample group threw Future error:", err);
       future.throw(err);
      } else {
      future.return(newId);
      }
    });

    return future.wait();
  },
  // Applies the expression and variance filters to a sample group
  // returns the job id...
  applyExprVarianceFilters: function(sampleGroupId){

    // checks and permissions
    check(sampleGroupId, String);
    let user = MedBook.ensureUser(Meteor.userId());
    let sampleGroup = SampleGroups.findOne(sampleGroupId);
    user.ensureAccess(sampleGroup);


  // delete existing filter blob if there is one ? TODO
  args = {
    sample_group_id: sampleGroupId
  }
    
    return Jobs.insert({
      name: "ApplyExprAndVarianceFilters",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args
    });
  },
});
