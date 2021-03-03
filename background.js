let messageTemplate = document.getElementById("messageTemplate");
let minDelayTime = document.getElementById("minDelayTime");
let maxDelayTime = document.getElementById("maxDelayTime");
let maxUserConnect = document.getElementById("maxUserConnect");
let checkBoxMessageTemplate = document.getElementById("rememberText");
let checkBoxTimeDelay = document.getElementById("rememberTime");
let checkBoxMaxConnect = document.getElementById("rememberMaxConnect");
let startActionBtn = document.getElementById("startActionBtn");

let notificationDiv = document.getElementById("notification");
notificationDiv.innerText = "Click vào nút ở trên là chạy thôi";

let tabId;

// INPUT ACTION
messageTemplate.addEventListener("input", clearNotification);
minDelayTime.addEventListener("input", clearNotification);
maxDelayTime.addEventListener("input", clearNotification);
maxUserConnect.addEventListener("input", clearNotification);

// CLICK BUTTON
startActionBtn.addEventListener("click", setAction);

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
  }
);

// FUNCTION
function setAction() {
  let msgTempl = messageTemplate.value.trim();
  let minTime = parseNumber(minDelayTime.value);
  let maxTime = parseNumber(maxDelayTime.value);
  let maxConn = parseNumber(maxUserConnect.value);

  if (!checkParams(msgTempl, minTime, maxTime, maxConn)) {
    return;
  }
  notificationDiv.innerText = "OK";

  const payload = {
    acl_msg_templ: checkBoxMessageTemplate.checked ? msgTempl : null,
    acl_min_delay: checkBoxTimeDelay.checked ? minTime : null,
    acl_max_delay: checkBoxTimeDelay.checked ? maxTime : null,
    acl_max_connect: checkBoxMaxConnect.checked ? maxConn : null,
    acl_chbox_msg: checkBoxMessageTemplate.checked ? true : false,
    acl_chbox_time: checkBoxTimeDelay.checked ? true : false,
    acl_chbox_conn: checkBoxMaxConnect.checked ? true : false
  };

  // SAVE SETTINGS
  chrome.storage.sync.set(payload);

  // CALL ACTION TO FOREGROUND
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0].url.includes('https://www.linkedin.com')) {
      notificationDiv.innerText = "❌ Go to https://www.linkedin.com to user this extension";
      return;
    }
    let tabId = tabs[0].id;

    const data = {
      msg_template: msgTempl,
      min_time_delay: minTime,
      max_time_delay: maxTime,
      max_user_connect: maxConn
    };

    const payload = {
      action: "start",
      data: data
    }
    chrome.tabs.sendMessage(tabs[0].id, payload);
  })
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
  if (minTime == null || maxTime == null) {
    notificationDiv.innerText = "❌ Time delay must be set";
    return false;
  }
  if (maxTime < minTime) {
    notificationDiv.innerText = "❌ minTime must be less than maxTime";
    return false;
  }
  if (maxConn == null) {
    notificationDiv.innerText = "❌ Max connect must be set";
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
  console.log(message);
  if (action === 'update') {
    notificationDiv.classList.remove('notification');
    if (!notificationDiv.classList.contains('notification-active')) {
      notificationDiv.classList.add('notification-active');
    }
    notificationDiv.innerText = "Đã kết nối tới "
      + data.connected
      + " người. \nLast update: "
      + new Date().toTimeString();
  }
})