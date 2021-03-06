function UpdateCbioData(job_id) {
  console.log('run UpdateCbioData', this, 'job', job_id);
  Job.call(this, job_id);
}
UpdateCbioData.prototype = Object.create(Job.prototype);
UpdateCbioData.prototype.constructor = UpdateCbioData;

UpdateCbioData.prototype.run = function () {
  // create paths for files on the disk
  // Use temporary folders at /tmp/UpdateCbioData[job_id]

  var workDir = "/tmp/" + "UpdateCbioData_" + this.job._id;

  try {
    fs.mkdirSync(workDir);
  } catch (e) {
    console.log("Pretty sure you reran the job: {$set: { status: 'waiting' }}");
    console.log("error:", e);
    throw e;
  }

  console.log("workDir: ", workDir);

  var self = this;
  var deferred = Q.defer();

  // This path will be where the expression data is scooped up from
  // by the Python cBioPortal importer. (It find the file by filename.)
  var expressionDataPath = path.join(workDir, "data_expression.txt");

  var clin_cmd = [
    "--sample_group_id",
    this.job.args.sample_group_id,
    "--form_id",
    this.job.args.form_id,
    "--work-dir",
    workDir
  ];
  if (!this.job.args.patient_form_id) {
    clin_cmd.push("--patient_form_id");
    clin_cmd.push(this.job.args.patient_form_id);
  }

  Q.all([
      // write the necessary files to disk

      // expression data to a file for use in Limma
      spawnCommand(getSetting("genomic_expression_export"), [
        "--sample_group_id", this.job.args.sample_group_id,
        "--cbio",
        "--uq-sample-labels",
      ], workDir, { stdoutPath: expressionDataPath }),

      // phenotype file for cbio importer
      spawnCommand(getSetting("cbioportal_clinical_export"), clin_cmd, workDir),
    ])
    .then(function (spawnResults)           {
      console.log("done writing files");

      _.each(spawnResults, function (result) {
        if (result.exitCode !== 0) {
          throw "Problem writing files to disk.";
        }
      });

      // save the file paths... order maters for spawnResults
      // (the order depends on the order of `spawnCommand`s in `Q.all`)
      var clinicalPath = spawnResults[1].stdoutPath;

      // run CbioImporter
      return spawnCommand(getSetting("cbio_importer_path"), [
        "-c import-study",
        "-jar",
        getSetting("cbio_core_jar_path"),
        "-s",
        workDir,
      ], workDir, { stdoutPath: "cbio_update_data_stdout.txt" });
    })
    .then(Meteor.bindEnvironment(function (cbioImportResult) {
      if (cbioImportResult.exitCode !== 0) {
        throw "Problem running cbio importer";
      }

      let associatedObj = {
        collection_name: "Jobs",
        mongo_id: self.job._id,
      };

      Blobs2.create(cbioImportResult.stdoutPath, associatedObj, {}, (error) => {
        if (error) {
          console.log("Error creating cBioPortal stdout");
          deferred.reject(error);
        } else {
          deferred.resolve();
        }
      });
    }, deferred.reject))
    .catch(deferred.reject);
  return deferred.promise;
};

JobClasses.UpdateCbioData = UpdateCbioData;
