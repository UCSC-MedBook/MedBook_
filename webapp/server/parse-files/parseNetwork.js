parseNetworkInteractions = function(fileObject, processingFunctions) {
  lineByLineStream(fileObject, function (line) {
    var brokenTabs = line.split("\t");
    if (brokenTabs.length === 3) {
      //console.log("adding interaction:", line);
      processingFunctions.documentInsert("network_interactions", {
        "source": brokenTabs[0],
        "target": brokenTabs[2],
        "interaction": brokenTabs[1],
      });
    } else {
      processingFunctions.onError("Invalid line: " + line);
      return;
    }
  });
};

parseNetworkElements = function(fileObject, processingFunctions) {
  lineByLineStream(fileObject, function(line){
    var brokenTabs = line.split("\t");
    if (brokenTabs.length === 2) {
      // console.log("adding definition:", line);
      processingFunctions.documentInsert("network_elements", {
        "label": brokenTabs[1],
        "type": brokenTabs[0],
      });
    } else {
      processingFunctions.onError("Invalid line: " + line);
      return;
    }
  });
};
