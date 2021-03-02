const SR_ITEM_DIV_CLASS = "entity-result__item";
const SR_NAME_SELECTOR =
  "div > div.entity-result__content.entity-result__divider.pt3.pb3.t-12.t-black--light > div.mb1 > div > div.t-roman.t-sans > span > div > span.entity-result__title-line.flex-shrink-1.entity-result__title-text--black > span > a > span > span:nth-child(1)";
const SR_CONNECT_BTN_SELECTOR =
  "button.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view";
const SR_ADD_NOTE_BTN_SELECTOR =
  "button.mr1.artdeco-button.artdeco-button--muted.artdeco-button--3.artdeco-button--secondary.ember-view";
const SR_NOTE_AREA_SELECTOR =
  "textarea.ember-text-area.ember-view.send-invite__custom-message.mb3";

const SR_SEND_NOTE_BTN =
  "button.ml1.artdeco-button.artdeco-button--3.artdeco-button--primary.ember-view";

let current_connection = 0;

// LISTEN MESSAGE FROM BACKEND
chrome.runtime.onMessage.addListener(gotMessage);

// FUNCTIONS
function gotMessage(message, sender, sendResponse) {
  console.log("I got message");
  let msgTemplate = message.msg_template;
  let minTime = message.min_time_delay;
  let maxTime = message.max_time_delay;
  let maxConn = message.max_user_connect;

  let rsList = document.querySelectorAll(`div.${SR_ITEM_DIV_CLASS}`);
  console.log(rsList.length);

  var i;
  for (i = 0; i < rsList.length; i++) {
    let item = rsList[i];
    setTimeout(() => {
      connectToUserItem(item, msgTemplate);
    }, 500);
    sleep(getRandomMilisecond(minTime * 1000 , maxTime * 1000));
  }
}

// FUNCTION TO ACTION CONNECT TO USER
function connectToUserItem(item, messageTemplate) {
  let userName = getNameFromItem(item);
  if (userName == null) {
    console.log("Not found user");
    return;
  }
  let clickConnectBtnSuccess = clickConnectButton(item);
  if (clickConnectBtnSuccess) {
    let addNoteSuccess = addNote(messageTemplate, userName);
    if (addNoteSuccess) {
      let sendConnectSucces = sendConnectInvite();
      if (sendConnectSucces) {
        current_connection += 1;
        console.log("Connect to " + current_connection + " user");
      }
    }
  }
}

function getRandomMilisecond(min, max) {
  return parseInt((Math.random() * (max - min + 1) + min) * 1000);
}

function getNameFromItem(item) {
  let nameSpan =  item.querySelector(SR_NAME_SELECTOR);
  console.log(nameSpan);
  if (nameSpan) {
    return nameSpan.innerText;
  }
  return null;
}

function clickConnectButton(item) {
  let connectButton = item.querySelector(SR_CONNECT_BTN_SELECTOR);
  if (connectButton) {
    setTimeout(() => {
      connectButton.click();
    }, 500);
  } else return false;
  return true;
}

function addNote(template, userName) {
  let content = template.replace("#NAME", userName);
  let addNoteBtn = document.querySelector(SR_ADD_NOTE_BTN_SELECTOR);
  if (addNoteBtn) {
    setTimeout(() => {
      addNoteBtn.click();
      let inputTextArea = document.querySelector(SR_NOTE_AREA_SELECTOR);
      if (inputTextArea) {
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(inputTextArea, content);
        let ev = new Event("input", { bubbles: true });
        inputTextArea.dispatchEvent(ev);
        return true;
      }
    }, 500);
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendConnectInvite() {
  let sendNoteBtn = document.querySelector(SR_SEND_NOTE_BTN);
  if (sendNoteBtn) {
    setTimeout(() => {
      console.log(sendNoteBtn);
    }, 500);
    return true;
  }
  return false;
}
