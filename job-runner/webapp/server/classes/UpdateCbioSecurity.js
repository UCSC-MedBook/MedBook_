function UpdateCbioSecurity (job_id) {
  Job.call(this, job_id);
}
UpdateCbioSecurity.prototype = Object.create(Job.prototype);
UpdateCbioSecurity.prototype.constructor = UpdateCbioSecurity;

import mysql from "mysql";

UpdateCbioSecurity.prototype.run = function () {

  var connection = mysql.createConnection({
    host     : "mysql",
    user     : "cbio",
    password : "P@ssword1",
    database : "cbioportal"
  });

  // 'error' events are special in node. If they occur without an attached
  // listener, a stack trace is printed and your process is killed.
  // suppress it instead. TODO : Fail the job when this error appears.
  connection.on('error', function(e) {
    console.log("UpdateCbioSecurity: Mysql connection failed:", e);
    console.log("Error suppressed to avoid crashing jobrunner.");
    // Throwing an error here appears to crash jobrunner entirely
    //throw new Error("Error establishing Mysql connection.");
  });

  connection.connect();

  // Collect this information out here so that it runs in the Meteor
  // environment, which we'll lose in the promise code below
  var allNamesAndEmails = _.map(this.job.args.collab_names, function (name) {
    var collab = Collaborations.findOne({ name: name });

    if (!collab) {
      throw new Error("collaboration name invalid: " + name);
    }

    return {
      name: name,
      emails: collab.getUserEmails(),
    };
  });

  var self = this;
  var jobDeferred = Q.defer();

  // This 5 was chosen arbitrarily because I don't know how to start with a
  // .then. I like it better when all the logic code is in .thens because
  // I find it easier to read.
  Q.when(5)
    // NOTE: Q.nfcall doesn't work here for some reason
    .then(function () {
      var deferred = Q.defer();

      connection.query("DELETE FROM users", function (error, result) {
        if (error) { deferred.reject(error); }
        else { deferred.resolve(result); }
      });

      return deferred.promise;
    })
    .then(function () {
      var deferred = Q.defer();

      connection.query("DELETE FROM authorities", function (error, result) {
        if (error) { deferred.reject(error); }
        else { deferred.resolve(result); }
      });

      return deferred.promise;
    })
    .then(function () {
      var deferred = Q.defer();
      var allPromises = [];

      // For each email insert into the users table and the authorities
      // table. Wait until every command is done running before continuing.
      _.each(allNamesAndEmails, function (nameAndEmails) {
        _.each(nameAndEmails.emails, function (email) {
          // insert into the users table
          var usersDeferred = Q.defer();
          connection.query('INSERT INTO users SET ?', {
            name: email,
            email: email,
            enabled: 1
          }, function (err, result) {
            if (err) { usersDeferred.reject(err); }
            else { usersDeferred.resolve(result); }
          });
          allPromises.push(usersDeferred.promise);

          // insert into the authorities table
          var authoritiesDeferred = Q.defer();
          connection.query('INSERT INTO authorities SET ?', {
            email: email,

            // TODO: change to `cbioportal:${nameAndEmails.name}`
            authority: 'cbioportal:ALL',
          }, function (err, result) {
            if (err) { authoritiesDeferred.reject(err); }
            else { authoritiesDeferred.resolve(result); }
          });
          allPromises.push(authoritiesDeferred.promise);
        });

        console.log("added " + nameAndEmails.emails.length + " users to " +
            "cbioportal:ALL");
      });

      // wait for all the promises to resolve and then continue
      Q.all(allPromises)
        .then(deferred.resolve)
        .catch(deferred.reject);

      return deferred.promise;
    })
    .then(function () {
      connection.end();

      jobDeferred.resolve();
    })
    .catch(function (error) {
      jobDeferred.reject(error);
    });

  return jobDeferred.promise;
};

// run this job immediately and also every 24 hours, but only on production
// and staging (or wherever it's really running)
if (process.env.WORLD_URL) {
  Meteor.startup(function () {
    // NOTE: the job can also be called by any user via Meteor method
    // in patient-care (refreshCBioPortalAccess)
    var newJobBlueprint = {
      name: "UpdateCbioSecurity",
      user_id: "admin",
      args: {
        collab_names: [ "WCDT" ]
      }
    };

    // set up a cron job to execute every so often
    SyncedCron.add({
      name: "update-cbio-security",
      schedule: function(parser) {
        // parser is a later.parse object
        return parser.text('every 24 hours');
      },
      job: function () {
        Jobs.insert(newJobBlueprint);
      },
    });

    // (after 5 minutes to make sure the cBio db started)
    Meteor.setTimeout(function () {
      Jobs.insert(newJobBlueprint);
    }, 1000 * 60 * 5);
  });
}

JobClasses.UpdateCbioSecurity = UpdateCbioSecurity;
