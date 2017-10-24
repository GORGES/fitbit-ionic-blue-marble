import { outbox } from "file-transfer";
import { settingsStorage } from "settings";
import * as log from "../common/log";
import * as messaging from "messaging";

log.log("companion", "started");
//settingsStorage.clear();

//  settings

let settings = { display:0, viewpoint:0, daynight:0,
                 altitude:0, zoom:0, refresh:0,
                 date:0, tap:0, vibration:0, battery:0 };
//  *** DEBUG
settings.tap = 1;
settings.vibration = 1;
function settingParse(key, json) {
  //  parse out key and val
  try {
    let data = JSON.parse(json);
    if (typeof(data.selected) != "undefined") {
      //  extract value
      let val = data.selected;
      if (Array.isArray(val))
        val = val[0];
      if (typeof(val) == "number") {
        log.log("settingParse", "key=" + key + "  val=" + val);
        //  compare
        if (settings[key] != val) {
          //  update setting
          settings[key] = val;
          //  something changed
          return true;
        }
      }
    }
  } catch (error) {
    log.log("settingParse", "key=" + key + "  error=" + error);
  }
  return false;
}
//  load default settings
for (let key in settings) {
  //settingsStorage.removeItem(key);
  //  retrieve from local storage
  let val = settingsStorage.getItem(key);
  if (typeof(val) == "string") {
    //  parse selected value
    settingParse(key, val);
    //[10:40:06 PM]onchange  key=display  newValue={"selected":[0],"values":[{"name":"Living Earth","value":0}]}
  }
}
//  settings listener
settingsStorage.onchange = function(event) {
  log.log("onchange", "key=" + event.key + "  newValue=" + event.newValue);
  //  parse out key and val
  if (settingParse(event.key, event.newValue)) {
    //  send single setting to app
    let data = {};
    data[event.key] = settings[event.key];
    log.log("onchange", "settings[" + event.key + "]=" + JSON.stringify(settings[event.key]));
    messageSend(data);
    //  possibly trigger refresh
    if ((event.key == "display") || (event.key == "viewpoint") ||
        (event.key == "daynight") || (event.key == "altitude") ||
        (event.key == "zoom"))
      requestEarth();
  }
};

//  local variables

let latitude = settingsStorage.getItem("latitude");
if (typeof(latitude) != "number")
  latitude = 0;
let longitude = settingsStorage.getItem("longitude");
if (typeof(longitude) != "number")
  longitude = 0;

//  messaging

function messageSend(data) {
  log.log("messageSend", "data=" + JSON.stringify(data));
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN)
    messaging.peerSocket.send(data);
}
messaging.peerSocket.onopen = function() {
  log.log("messaging", "onopen");
  //  send all settings to app
  messageSend(settings);
}
messaging.peerSocket.onmessage = function(event) {
  let data = event.data;
  if (typeof(data) != "undefined") {
    log.log("onmessage", JSON.stringify(data));
    //  location
    if (typeof(data.latitude) != "undefined") {
      latitude = data.latitude;
      settingsStorage.setItem("latitude", latitude);
    }
    if (typeof(data.longitude) != "undefined") {
      longitude = data.longitude;
      settingsStorage.setItem("longitude", longitude);
    }
    //  action
    if (typeof(data.action) != "undefined") {
      if (data.action == "request")
        //  request image generation
        requestEarth();
      else if (data.action == "tap") {
        //  cycle display
        settings.display = (settings.display + 1) % ((settings.tap == 1) ? 8 : 3);
        log.log("onmessage", "display=" + settings.display);
        requestEarth();
        /*
        //  trap errors
        try {
          //  retrieve from local storage
          let val = settingsStorage.getItem("display");
          //log.log("onmessage  typeof(val)=" + typeof(val));
          if (typeof(val) == "string") {
            //  parse out key and val
            log.log("onmessage  val=" + val);
            let data = JSON.parse(val);
            log.log("onmessage  data=" + data);
            if (typeof(data.selected) != "undefined") {
              log.log("onmessage  before json=" + JSON.stringify(data));
              //  update selected value and store again
              data.selected = [settings.display];
              //  store again
              log.log("onmessage  after json=" + JSON.stringify(data));
              settingsStorage.setItem("display", JSON.stringify(data));
              log.log("onmessage  display");
              //  trigger a refresh
              requestEarth();
            }
          }
        } catch (error) {
          log.log("onmessage  tap  val=" + val + "  error=" + error);
        }
        */
      }
    }
  }
}

//  earth

function requestEarth() {
  log.log("requestEarth", "settings.display=" + settings.display);
  if ((settings.viewpoint != 0) || (latitude != 0) || (longitude != 0)) {
    //  zoom options
    //let zoom_size = 300;
    //zoom_size = 2 * Math.round(Math.pow(zoom_size, settings["zoom"]), zoom_size / 2);
    //  load image
    //var img_options = [ "learth.evif", "NASA500m.evif", "nasa.evif",
    //                    "NOAAtopo.evif", "cloudy.bmp", "irsat.bmp",
    //                    "wx-cmap.bmp", "vapour_bg.bmp", "learth",
    //                    "learth", "learth" ];
    //var viewpoint_options = [ "-l", "-l", "-s", "-m" ];
    //var night_options = [ "", "&daynight=-d" ];
    //var altitude_options = [ "35785", "1000", "50" ];
    //var url = "https://www.fourmilab.ch/cgi-bin/Earth?dynimg=y" +
    //          "&imgsize=" + zoom_size +
    //          "&img=" + img_options[settings["display"]] +
    //          "&opt=" + viewpoint_options[settings["viewpoint"]] +
    //          night_options[settings["daynight"]] +
    //          "&lat=" + Math.abs(latitude) +
    //          "&ns=" + ((latitude >= 0) ? "North" : "South") +
    //          "&lon=" + Math.abs(longitude) +
    //          "&ew=" + ((longitude >= 0) ? "East" : "West") +
    //          "&alt=" + altitude_options[settings["altitude"]] +
    //          "&tle=&date=0&utc=&jd=";
    let url = "https://setpebble.com/marble?" +
              "latitude=" + latitude + "&" +
              "longitude=" + longitude + "&" +
              "display=" + settings.display + "&" +
              "viewpoint=" + settings.viewpoint + "&" +
              "daynight=" + settings.daynight + "&" +
              "altitude=" + settings.altitude + "&" +
              "zoom=" + settings.zoom;
    //log.log("requestEarth", "settings=" + JSON.stringify(settings));
    log.log("requestEarth", "url=" + url);
    //  retrieve image
    fetch(url).then(function(response) {
      //log.log("requestEarth", "typeof(response)=" + typeof(response));
      return response.arrayBuffer();
    }).then(function(buffer) {
      /*
      //  decode Jpeg
      let jpegImage = new JpegImage();
      jpegImage.parse(rawData);
      let width = jpegImage.width;
      let height = jpegImage.height;
      log.log("processImage", "width=" + width + "  height=" + height);
      //  release memory
      buffer = null;
      rawData = null;
      //  new image size
      let side = 100;
      //  retrieve pixels
      log.log("processImage", "before getData");
      var internalData = jpegImage.getData(width, height);
      log.log("processImage", "after getData");
      log.log("processImage", "jpegImage.components.length=" + jpegImage.components.length);
      let pixelsOrig = new Uint8Array(4 * width * height);
      log.log("processImage", "pixelsOrig=" + pixelsOrig);
      let imageData = { width:width, height:height, data:pixelsOrig };
      log.log("processImage", "imageData=" + imageData);
      log.log("processImage", "before copyToImageData");
      jpegImage.copyToImageData(imageData);
      log.log("processImage", "after copyToImageData");
      //  copy pixels to new data array
      log.log("processImage", "before allocation");
      let pixelsCopy = new UInt8Array(4 * side * side);
      log.log("processImage", "after allocation");
      log.log("processImage", "pixelsCopy=" + pixelsCopy);
      let xOffset = (width - side) / 2;
      let yOffset = (height - side) / 2;
      log.log("processImage", "xOffset=" + xOffset + "  yOffset=" + yOffset);
      for (let y = 0;  y < side;  y++) {
        for (let x = 0;  x < side;  x++) {
          for (let c = 0;  c < 4;  c++) {
            pixelsCopy[4 * (side * y + x) + c] = pixelsOrig[4 * (side * (y + yOffset) + (x + xOffset)) + c];
          }
        }
      }
      log.log("requestEarth", "copied");
      */
      //  calculate random number
      let rnd = Math.round(1000000 * Math.random());
      //  queue the file for transfer
      outbox.enqueue("earth" + rnd + ".jpg", buffer).then(function(fileTransfer) {
        //  queued successfully
        log.log("requestEarth", "transfer successful  earth" + rnd + ".jpg");
      }).catch(function (error) {
        //  failed to queue
        throw new Error("requestEarth  error=" + error);
      });
    }).catch(function (error) {
      log.log("requestEarth", "error=" + JSON.stringify(error));
      reject(error);
    });
  }
}