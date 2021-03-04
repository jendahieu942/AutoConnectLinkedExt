let messageTemplate = document.getElementById("messageTemplate");
let minDelayTime = document.getElementById("minDelayTime");
let maxDelayTime = document.getElementById("maxDelayTime");
let maxUserConnect = document.getElementById("maxUserConnect");
let checkBoxMessageTemplate = document.getElementById("rememberText");
let checkBoxTimeDelay = document.getElementById("rememberTime");
let checkBoxMaxConnect = document.getElementById("rememberMaxConnect");
let pageType = document.querySelector("input[name=type_page]:checked").value;
let startActionBtn = document.getElementById("startActionBtn");
let resetBtn = document.getElementById("resetBtn");
let connected = 0;
let lastTime = null;
let statusAction = 0;
let action = "stop";
let status = 0;

let notificationDiv = document.getElementById("notification");
notificationDiv.innerText = "Click vào nút ở trên là chạy thôi";

// INPUT ACTION
messageTemplate.addEventListener("input", clearNotification);
minDelayTime.addEventListener("input", clearNotification);
maxDelayTime.addEventListener("input", clearNotification);
maxUserConnect.addEventListener("input", clearNotification);

// CLICK BUTTON
startActionBtn.addEventListener("click", setAction);

// RESET
resetBtn.addEventListener('click', resetMaxConnect);

// OTHER
chrome.storage.sync.get(
  [
    "acl_msg_templ",
    "acl_min_delay",
    "acl_max_delay",
    "acl_max_connect",
    "acl_chbox_msg",
    "acl_chbox_time",
    "acl_chbox_conn",
    "acl_connected",
    "acl_last_time",
    "acl_action",
    "acl_page_type"
  ],
  (object) => {
    messageTemplate.value = object.acl_msg_templ ? object.acl_msg_templ : "";
    minDelayTime.value = object.acl_min_delay ? object.acl_min_delay : "5";
    maxDelayTime.value = object.acl_max_delay ? object.acl_max_delay : "10";
    maxUserConnect.value = object.acl_max_connect
      ? object.acl_max_connect
      : "50";
    checkBoxMessageTemplate.checked = object.acl_chbox_msg;
    checkBoxTimeDelay.checked = object.acl_chbox_time;
    checkBoxMaxConnect.checked = object.acl_chbox_conn;
    connected = object.acl_connected ? object.acl_connected : connected;
    lastTime = object.acl_last_time ? object.acl_last_time : lastTime;
    action = object.acl_action ? object.acl_action : action;
    pageType = object.acl_page_type ? object.acl_page_type : pageType;

    status = (action == "stop") ? 0 : 1;
    if (connected != null) displayNotification(connected, lastTime);
    displayActionBtn();
    document.getElementById(pageType).checked = true;
  }
);

function resetMaxConnect() {
  chrome.storage.sync.get(
    [
      "acl_connected",
      "acl_last_time"
    ],
    (object) => {
      if (object.acl_connected) {
        chrome.storage.sync.remove('acl_connected');
        connected = 0;
      }
      if (object.acl_last_time) {
        chrome.storage.sync.remove('acl_last_time');
        lastTime = null;
      }
      notificationDiv.innerText = "Reseted current connect to 0";
    }
  )
}

// FUNCTION
function setAction() {
  let msgTempl = messageTemplate.value.trim();
  let minTime = parseNumber(minDelayTime.value);
  let maxTime = parseNumber(maxDelayTime.value);
  let maxConn = parseNumber(maxUserConnect.value);
  pageType = document.querySelector("input[name=type_page]:checked").value;

  if (!checkParams(msgTempl, minTime, maxTime, maxConn)) {
    return;
  }
  if (connected != null && connected >= maxUserConnect.value) {
    action = "stop";
    status = 0;
    chrome.storage.sync.set({ acl_action: action });
    displayActionBtn();
    if (notificationDiv.classList.contains('notification-active')) {
      notificationDiv.classList.remove('notification-active');
      notificationDiv.classList.add('notification');
    }
    let warning = "Đã kết nối tới " + connected + " người. \nLast update: " + lastTime;
    warning += "\nĐÃ ĐẠT MAX_CONNECT = " + maxUserConnect.value;
    notificationDiv.innerText = warning;
    return;
  }

  const payload = {
    acl_msg_templ: checkBoxMessageTemplate.checked ? msgTempl : null,
    acl_min_delay: checkBoxTimeDelay.checked ? minTime : null,
    acl_max_delay: checkBoxTimeDelay.checked ? maxTime : null,
    acl_max_connect: checkBoxMaxConnect.checked ? maxConn : null,
    acl_chbox_msg: checkBoxMessageTemplate.checked ? true : false,
    acl_chbox_time: checkBoxTimeDelay.checked ? true : false,
    acl_chbox_conn: checkBoxMaxConnect.checked ? true : false,
    acl_page_type: pageType
  };

  // SAVE SETTINGS
  chrome.storage.sync.set(payload);

  // CALL ACTION TO FOREGROUND
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0].url.includes('https://www.linkedin.com')) {
      notificationDiv.innerText = "❌ Go to https://www.linkedin.com to user this extension";
      return;
    }

    status = 1 - status;
    displayActionBtn();
    chrome.storage.sync.set({ acl_action: action });

    const data = {
      msg_template: msgTempl,
      min_time_delay: minTime,
      max_time_delay: maxTime,
      max_user_connect: maxConn,
      current_connect: connected,
      page_type: pageType
    };

    const payload = {
      action: action,
      data: data
    }
    chrome.tabs.sendMessage(tabs[0].id, payload);
  });
}

function parseNumber(stringValue) {
  if (stringValue == "null" || stringValue.trim().length == 0) {
    return null;
  }
  return parseInt(stringValue.trim());
}

function checkParams(msgTempl, minTime, maxTime, maxConn) {
  if (!notificationDiv.classList.contains('notification')) {
    notificationDiv.classList.add('notification');
  }
  if (msgTempl.length == 0) {
    notificationDiv.innerText = "❌ Message template could not empty";
    return false;
  }
  if (msgTempl.length > 1000) {
    notificationDiv.innerText =
      "❌ Message template should be short and condensed";
    return false;
  }
  if (!msgTempl.includes("#NAME")) {
    notificationDiv.innerText = "❌ Not found #NAME in template message";
    return false;
  }
  if (minTime == null || maxTime == null || minTime <= 0 || maxTime <= 0) {
    notificationDiv.innerText = "❌ Time delay must be set and greater than 0";
    return false;
  }
  if (maxTime < minTime) {
    notificationDiv.innerText = "❌ minTime must be less than maxTime";
    return false;
  }
  if (maxConn == null || maxConn <= 0) {
    notificationDiv.innerText = "❌ Max connect must be set and greater than 0";
    return false;
  }
  return true;
}

function clearNotification() {
  notificationDiv.innerText = "";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let action = message.action;
  let data = message.data;
  if (action === 'update') {
    connected = data.connected;
    chrome.storage.sync.set({ acl_connected: connected, acl_last_time: new Date().toTimeString() });
    displayNotification(connected, new Date().toTimeString());
  }
})

function displayNotification(currentConn, lastTime) {
  notificationDiv.classList.remove('notification');
  if (!notificationDiv.classList.contains('notification-active')) {
    notificationDiv.classList.add('notification-active');
  }
  notificationDiv.innerText = "Đã kết nối tới " + currentConn + " người. \nLast update: " + lastTime;
}

function displayActionBtn() {
  if (status == 1) {
    if (!startActionBtn.classList.contains('button-stop')) {
      startActionBtn.classList.add('button-stop');
    }
    action = "start";
    startActionBtn.innerText = "Stop Auto Connect ⏸️";
  } else {
    if (startActionBtn.classList.contains('button-stop')) {
      startActionBtn.classList.remove('button-stop');
    }
    action = "stop";
    startActionBtn.innerText = "Start Auto Connect ⏯";
  }
}