import * as fs from "fs";
import * as log from "../common/log";

//  constants

let fileName = "persist.txt";

//  methods

export function save(persistJson) {
  log.log("persist.save", "persistJson=" + JSON.stringify(persistJson) + "  fileName=" + fileName);
  //  write settings to file
  fs.writeFileSync(fileName, persistJson, "json");
  //  *** DEBUG *** check file
  //let checkJson = fs.readFileSync(fileName, "json");
  //log.log("persist.save", "checkJson=" + JSON.stringify(checkJson));
}

export function load(persistDefault) {
  log.log("persist.load", "persistDefault=" + JSON.stringify(persistDefault) + "  fileName=" + fileName);
  var result = persistDefault;
  try {
    let stats = fs.statSync(fileName);
    if (stats) {
      log.log("persist.load", "size=" + stats.size + "  modified: " + stats.mtime);
      result = fs.readFileSync(fileName, "json");
      log.log("persist.load", "result=" + JSON.stringify(result));
    }
  } catch (error) {
    log.log("persist.load", "error=" + error);
    //  create new files with default values
    save(persistDefault);
  }
  //  read file
  return result;
}