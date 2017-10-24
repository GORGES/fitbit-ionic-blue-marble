import clock from "clock";
import document from "document";
import haptics from "haptics";
import * as fs from "fs";
import * as log from "../common/log";
import * as messaging from "messaging";
import * as persist from "../common/persist";
import { inbox } from "file-transfer";
import { geolocation } from "geolocation";
import { memory } from "system";
import { locale } from "user-settings";
import { preferences } from "user-settings";
import { device } from "user-settings";
//import { battery } from "power";

//  widgets

let objBackground = document.getElementById("background");
var objTime = document.getElementById("time");
var objTimeLeft = document.getElementById("timeLeft");
var objTimeRight = document.getElementById("timeRight");
var objTimeTop = document.getElementById("timeTop");
var objTimeBottom = document.getElementById("timeBottom");
var objDate = document.getElementById("date");
var objDateLeft = document.getElementById("dateLeft");
var objDateRight = document.getElementById("dateRight");
var objDateTop = document.getElementById("dateTop");
var objDateBottom = document.getElementById("dateBottom");
var objBattery = document.getElementById("battery");
var objBatteryFill = document.getElementById("batteryFill");
var objButton = document.getElementById("button");

//  settings

let settings = persist.load({ display:0, date:0, viewpoint:0, battery:0,
                              refresh:0, tap:0, vibration:0,
                              earth:"", latitude:0, longitude:0 });

//  default earth

if (settings.earth.length > 0) {
  //  set background to existing file
  try {
    let stats = fs.statSync(settings.earth);
    if (stats) {
      log.log("default", "earth=" + settings.earth + "  size=" + stats.size);
      //  set background to existing image
      objBackground.href = "/private/data/" + settings.earth;
    }
  } catch (error) {
    log.log("default", "error=" + error + "  (ignored)");
  }
}

//  messaging

function send(data) {
  log.log("requestEarth", "readyState=" + messaging.peerSocket.readyState + "  OPEN=" + messaging.peerSocket.OPEN);
  //  check connection
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    log.log("requestEarth", "sending " + JSON.stringify(data));
    //  send the data to peer as a message
    messaging.peerSocket.send(data);
  } else {
    //  try again in a minute
    setTimeout(function() {
      send(data);
    }, 60 * 1000)
  }
}
messaging.peerSocket.onopen = function() {
  log.log("messaging", "onopen");
  //  send request upon connection
  if ((settings.viewpoint > 0) || (settings.latitude != 0) || (settings.longitude != 0)) {
    //  send request
    send({latitude:settings.latitude, longitude:settings.longitude, action:"request"});
    //  reset timer
    setupTimer();
  }
}
messaging.peerSocket.onerror = function(error) {
  log.log("messaging", "error=" + error);
}
messaging.peerSocket.onmessage = function(event) {
  log.log("onmessage", "event=" + JSON.stringify(event));
  //  transfer to settings
  for (let key in event.data) {
    //  check for changes
    if (settings[key] != event.data[key]) {
      //  store locally
      settings[key] = event.data[key];
      log.log("onmessage", key + "=" + event.data[key]);
      //  check specific keys
      if (key == "refresh")
        //  check timer
        setupTimer();
      else if ((key == "viewpoint") && (settings.latitude == 0) && (settings.longitude == 0))
        //  update GPS
        requestLocation();
      else if (key == "date")
        //  update screen
        refreshScreen();
      else if (key == "tap")
        //  enable/disable button
        objButton.enabled = (settings.tap > 0);
    }
  }
  //  persist
  persist.save(settings);
}

//  file transfer

inbox.onnewfile = function () {
  let fileName;
  do {
    //  retrieve file
    fileName = inbox.nextFile();
    if (fileName) {
      log.log("inbox", "file=\"" + fileName + "\"");
      //  set background to new file
      objBackground.href = "/private/data/" + fileName;
      //  remove existing temporary file
      if (settings.earth.length > 0) {
        try {
          fs.unlinkSync(settings.earth);
        } catch (error) {
          log.log("inbox", "error=" + error);
        }
      }
      //  set background to new file and persist
      settings.earth = fileName;
      persist.save(settings);
      //  get file size
      try {
        let stats = fs.statSync(fileName);
        if (stats)
          log.log("inbox", "fileName=" + fileName + "  size=" + stats.size);
      } catch (error) {
        log.log("inbox", "error=" + error);
      }
    }
  } while (fileName);
};

//  location

let watchGeo = null;
function requestLocation() {
  //  check for already watching
  log.log("requestLocation", "watchGeo=" + watchGeo);
  /*
  if (watchGeo !== null) {
    watchGeo = geolocation.watchPosition(
      function(position) {
        //  check for changing the timer
        let resetTimer = (settings.latitude == 0) && (settings.longitude == 0);
        //  remember location
        settings.latitude = position.coords.latitude;
        settings.longitude = position.coords.longitude;
        persist.save(settings);
        log.log("latitude=" + settings.latitude + "  longitude=" + settings.longitude);
        //  send location and request to companion
        requestEarth();
        //  reset timer
        if (resetTimer)
          setupTimer();
        //  clear watching location
        geolocation.clearWatch(watchGeo);
        watchGeo = null;
      },
      function(error) {
        log.log("geolocation error=" + error.message + " (code=" + error.code + ")");
        //  try again later?
      });
  }
  */
  geolocation.getCurrentPosition(
    function(position) {
      //  check for changing the timer
      let resetTimer = (settings.latitude == 0) && (settings.longitude == 0);
      //  remember location
      settings.latitude = position.coords.latitude;
      settings.longitude = position.coords.longitude;
      persist.save(settings);
      log.log("geolocation", "latitude=" + settings.latitude + "  longitude=" + settings.longitude);
      //  send location and request to companion
      requestEarth();
      //  reset timer
      if (resetTimer)
        setupTimer();
    },
    function(error) {
      log.log("geolocation", "error=" + error.message + " (code=" + error.code + ")");
      //  keep trying until successful
      setTimeout(function() {
        //  call again
        requestLocation();
      }, 3 * 1000)
    });
}

//  earth

function requestEarth() {
  log.log("requestEarth", "latitude=" + settings.latitude + "  longitude=" + settings.longitude);
  if ((settings.viewpoint > 0) || (settings.latitude != 0) || (settings.longitude != 0))
    //  send locaiton and request action to companion
    send({latitude:settings.latitude, longitude:settings.longitude, action:"request"});
}

//  display

function refreshScreen() {
  log.log("refreshScreen");
  let today = new Date();
  //  time
  let hours = today.getHours();
  if (preferences.clockDisplay == "12h") {
    hours = hours % 12;
    if (hours == 0)
      hours += 12;
  }
  let mins = today.getMinutes();
  if (mins < 10)
    mins = "0" + mins;
  let time = hours + ":" + mins;
  objTime.innerText = time;
  objTimeLeft.innerText = time;
  objTimeRight.innerText = time;
  objTimeTop.innerText = time;
  objTimeBottom.innerText = time;
  //  date
  let date = "";
  if (settings.date < 8) {
    let weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today.getDay()];
    let month = ["January","February","March","April","May","June","July","August","September","October","November","December"][today.getMonth()];
    let monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()];
    let dayOfMonth = today.getDate();
    switch (settings.date) {
      case 0:
        date = weekday + "  " + monthShort + " " + dayOfMonth;
        break;
      case 1:
        date = weekday + "  " + dayOfMonth + " " + monthShort;
        break;
      case 2:
        date = month + " " + dayOfMonth;
        break;
      case 3:
        date = dayOfMonth + " " + month;
        break;
      case 4:
        date = "" + (today.getMonth() + 1) + "/" + dayOfMonth + "/" + today.getFullYear();
        break;
      case 5:
        date = "" + dayOfMonth + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
        break;
      case 6:
        date = "" + (today.getMonth() + 1) + "-" + dayOfMonth + "-" + today.getFullYear();
        break;
      case 7:
        date = "" + dayOfMonth + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
        break;
    }
  }
  objDate.innerText = date;
  objDateLeft.innerText = date;
  objDateRight.innerText = date;
  objDateTop.innerText = date;
  objDateBottom.innerText = date;
  //  battery
  let chargeLevel = 21;
  let charging = false;
  settings.battery = 0;
  if ((settings.battery == 1) || ((settings.battery == 2) && (chargeLevel <= 20))) {
    objBatteryFill.style.display = "block";
    objBatteryFill.style.fill = (chargeLevel <= 20) ? "red" : "green";
    objBattery.style.display = "block";
    let amount = Math.round(chargeLevel * 70) / 100;
    objBatteryFill.y = 177 - amount;
    objBatteryFill.height = amount;
  } else {
    objBatteryFill.style.display = "none";
    objBattery.style.display = "none";
  }
}

//  tap

//let tapCount = 0;
//let tapTime = 0;
objButton.onactivate = function(event) {
  log.log("onactivate", "tap=" + settings.tap);
  //  current time
  /*
  let time = (new Date()).getTime();
  if (time - tapTime > 500) {
    //  reset taps
    tapCount = 1;
  } else {
    //  boost tap count
    tapCount++;
    //  check for double-taps
    if (tapCount == 2) {
      //  tap behavior
      if (settings.tap > 0) {
        //  send tap action back to watch
        send({action:"tap"});
      }
    }
  }
  //  set tap time
  tapTime = time;
  */
  //  tap behavior
  if (settings.tap > 0)
    //  send tap action back to watch
    send({action:"tap"});
}

//  refresh

let timer = null;
function setupTimer() {
  //  cancel existing timer
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  //  determine interval
  var refreshes = [60 * 60, 30 * 60, 15 * 60, 0];
  let seconds = refreshes[settings.refresh];
  if ((settings.viewpoint == 0) && (settings.latitude == 0) && (settings.longitude == 0))
    seconds = 0;
  log.log("setupTime", "seconds=" + seconds + "  settings.refresh=" + settings.refresh);
  //  check refresh setting
  if (seconds > 0) {
    //  create new timer
    timer = setInterval(function() {
      log.log("timer", "triggering requestEarth");
      //  request GPS or updated image
      requestEarth();
    }, seconds * 1000);
  }
}

//  clock

let hapticFlag = false;
clock.granularity = "minutes"; // seconds, minutes, hours
clock.ontick = function(event) {
  log.log("ontick", "event=" + JSON.stringify(event));
  //  hourly vibration
  if (settings.vibration) {
    let now = new Date();
    if (!now.getMinutes()) {
      //  check flag
      if (!hapticFlag) {
        //  check preferences
        log.log("ontick", "device.vibrationEnabled=" + device.vibrationEnabled);
        if (device.vibrationEnabled)
          //  vibrate watch
          haptics.vibration.start("ping");
        //  set flag
        hapticFlag = true;
      }
    } else {
      //  clear flag
      hapticFlag = false;
    }
  }
  //  just refresh the screen
  refreshScreen();
};

//  memory

log.log("memory", `js used=${memory.js.used}  peak=${memory.js.peak}  total=${memory.js.total}`);
log.log("memory", `native  used=${memory.native.used}  peak=${memory.native.peak}  total=${memory.native.total}`);
memory.monitor.addEventListener("memorypressurechange", () => {
  log.log("memory", `pressure=${memory.monitor.pressure}`)
  if ((memory.monitor.pressure == "high") || (memory.monitor.pressure == "critical")) {
    //  try to release some objects, unused memory, etc.
  }
});

//  initialize

log.log("initialize");
//  redraw screen
refreshScreen();
//  trigger new location
if (settings.viewpoint == 0)
  requestLocation();
//  set timer
setupTimer();
//  send request if latitude & longitude were cached
if ((settings.latitude != 0) || (settings.longitude != 0))
  requestEarth();