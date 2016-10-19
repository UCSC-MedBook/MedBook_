// Template.manageObjects

var managableTypes = [
  {
    collectionSlug: "data-sets",
    humanName: "Data Sets",
    singularName: "data set",
    collectionName: "DataSets",
    introTemplate: "introDataSets",
    createTemplate: "createDataSet",
    showTemplate: "showDataSet",
  },
  {
    collectionSlug: "sample-groups",
    humanName: "Sample Groups",
    singularName: "sample group",
    collectionName: "SampleGroups",
    introTemplate: "introSampleGroups",
    createTemplate: "createSampleGroup",
    showTemplate: "showSampleGroup",
    permissionDeniedTemplate: "waitAndThenPermissionDenied",
  },
  {
    collectionSlug: "gene-sets",
    humanName: "Gene Sets",
    singularName: "gene set",
    collectionName: "GeneSets",
    introTemplate: "introGeneSets",
    createTemplate: "createGeneSet",
    showTemplate: "showGeneSet",
  },
  {
    collectionSlug: "gene-set-groups",
    humanName: "Gene Set Groups",
    singularName: "gene set group",
    collectionName: "GeneSetGroups",
    introTemplate: "introGeneSetGroups",
    createTemplate: "createGeneSetGroup",
    showTemplate: "showGeneSetGroup",
  },
  {
    collectionSlug: "studies",
    humanName: "Studies",
    singularName: "study",
    collectionName: "Studies",
    introTemplate: "introStudies",
    createTemplate: "createStudy",
    showTemplate: "showStudy",
  },
  {
    collectionSlug: "clinical-forms",
    humanName: "Clinical Forms",
    singularName: "clinical form",
    collectionName: "Forms",
    introTemplate: "introForms",
    createTemplate: "createForm",
    showTemplate: "showForm",
  },
];

Template.manageObjects.helpers({
  managableTypes: managableTypes,
  tabActive() {
    return this.collectionSlug === FlowRouter.getParam("collectionSlug");
  },
  selectedType() {
    let selected = FlowRouter.getParam("collectionSlug");

    return _.findWhere(managableTypes, { collectionSlug: selected });
  },
});

// Template.dataTypeInfoIcon

Template.dataTypeInfoIcon.onRendered(function () {
  let instance = this;

  instance.$(".help.circle.icon").popup({
    position: "bottom left",
    hoverable: true,
  });
});

// Template.manageObjectsGrid

Template.manageObjectsGrid.onCreated(function () {
  let instance = this;

  instance.currentlyManaging = new ReactiveVar();

  // subscribe to the names of the available data, and
  // set instance.currentlyManaging
  instance.autorun(() => {
    let slug = FlowRouter.getParam("collectionSlug");
    let currObj = _.findWhere(managableTypes, { collectionSlug: slug });

    instance.currentlyManaging.set(currObj);
    instance.subscribe("allOfCollectionOnlyMetadata", currObj.collectionName);
  });

  // if the user selected something before, select that one
  var lastSlug;

  instance.autorun((computation) => {
    let selected = FlowRouter.getParam("selected");
    let collectionSlug = FlowRouter.getParam("collectionSlug");

    if (lastSlug !== collectionSlug && !selected) {
      let fromSession = Session.get("manageObjects-" + collectionSlug);

      // Only execute after a bit because of a race condition between
      // this firing and the URL actually getting set.
      // (FlowRouter.getParam("selected") works fine but the URL is wrong)
      Meteor.defer(() => {
        FlowRouter.setParams({
          selected: fromSession
        });
      });
    } else {
      Session.set("manageObjects-" + collectionSlug, selected);
    }

    lastSlug = collectionSlug;
  });
});

function getObjects (instance, query = {}) {
  // get all the objects for this data type
  let slug = FlowRouter.getParam("collectionSlug");
  let managing = instance.currentlyManaging.get();

  return MedBook.collections[managing.collectionName].find(query, {
    // need to sort by _id also to break ties: if two things have the same
    // name, clicking on one can cause the list to reorder itself
    sort: { name: 1, version: 1, _id: 1 },
  });
}

Template.manageObjectsGrid.helpers({
  getObjects() { return getObjects(Template.instance()); },
  managingObject() {
    return this._id === FlowRouter.getParam("selected");
  },
  showVersion() {
    if (this.version) {
      let instance = Template.instance();

      // only show the version if the version isn't 1 or there's a duplicate
      return this.version !== 1 ||
          getObjects(instance, { name: this.name }).count() > 1;
    }
  },
});

// Template.manageObject

Template.manageObject.onCreated(function () {
  let instance = this;

  // subscribe to the selected object
  instance.autorun(() => {
    let { collectionName } = instance.data;
    let selectedId = FlowRouter.getParam("selected");

    if (selectedId) {
      instance.subscribe("objectFromCollection", collectionName, selectedId);
    }
  });
});

Template.manageObject.helpers({
  getObjects() {
    return getObjects(Template.instance().parent());
  },
  getObject() {
    let slug = FlowRouter.getParam("collectionSlug");
    let managing = _.findWhere(managableTypes, { collectionSlug: slug });
    let selectedId = FlowRouter.getParam("selected");

    return MedBook.collections[managing.collectionName].findOne(selectedId);
  },
  onDelete() {
    return () => {
      FlowRouter.setParams({ selected: null });
    };
  },
});
