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
const SR_CLOSE_CONNECT_MODAL =
  "button.artdeco-modal__dismiss.artdeco-button.artdeco-button--circle.artdeco-button--muted.artdeco-button--2.artdeco-button--tertiary.ember-view";

const NEXT_PAGE_BTN =
  "button.artdeco-pagination__button.artdeco-pagination__button--next.artdeco-button.artdeco-button--muted.artdeco-button--icon-right.artdeco-button--1.artdeco-button--tertiary.ember-view";

let current_connection = 0;
let minDelay = 0;
let maxDelay = 0;
let maxConnect = 1;
let msgTemplate = "";
var i = 0;
var retries = 0;
let doing = false;

// LISTEN MESSAGE FROM BACKEND
chrome.runtime.onMessage.addListener(gotMessage);

// FUNCTIONS
function gotMessage(message, sender, sendResponse) {
  let action = message.action;
  let data = message.data;

  console.log("action = " + action);
  console.log("data = " + data);

  msgTemplate = data.msg_template;
  minDelay = data.min_time_delay;
  maxDelay = data.max_time_delay;
  maxConnect = data.max_user_connect;
  current_connection = data.current_connect ? data.current_connect : current_connection;
  doing = (action == "start");
  if (doing) doAction();
}

async function doAction() {
  await delay(5000);
  let rsList = document.querySelectorAll(`div.${SR_ITEM_DIV_CLASS}`);
  for (i = 0; i < rsList.length; i++) {
    if (!doing) {
      console.log("doing = " + doing);
      break;
    }
    if (current_connection >= maxConnect) break;
    let item = rsList[i];
    actionItem(item);
    item.scrollIntoView();
    await delay(getRandomMilisecond(minDelay, maxDelay));
  }
  if (doing) {
    if (current_connection < maxConnect) {
      let nextPageBtn = document.querySelector(NEXT_PAGE_BTN);
      console.log("i = " + i);
      console.log("current = " + current_connection);
      console.log(nextPageBtn);
      if (nextPageBtn) {
        nextPageBtn.click();
        console.log("Oping next page");
        i = 0;
        await doAction();
      } else {
        console.log("No Next Page");
      }
    }
  }
}

async function actionItem(item) {
  // GET NAME
  let userName = getNameFromItem(item);
  if (userName == null) {
    console.log("Not found user");
    return;
  }
  // START CONNECT
  let connectButton = item.querySelector(SR_CONNECT_BTN_SELECTOR);
  if (connectButton) {
    // CLICK CONNECT
    connectButton.click();
    // ADD NOTE
    let content = msgTemplate.replace("#NAME", userName);
    let addNoteBtn = document.querySelector(SR_ADD_NOTE_BTN_SELECTOR);
    if (addNoteBtn) {
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
        console.log(content);

        // SENT WITH NOTE
        let sendNoteBtn = document.querySelector(SR_SEND_NOTE_BTN);
        if (sendNoteBtn) {
          sendNoteBtn.click();
          await delay(1000);
          current_connection += 1;
          chrome.runtime.sendMessage({ action: "update", data: { connected: current_connection } })
        }
      }
    }
  }
}

function getRandomMilisecond(min, max) {
  return parseInt((Math.random() * (max - min + 1) + min) * 1000);
}

function getNameFromItem(item) {
  let nameSpan = item.querySelector(SR_NAME_SELECTOR);
  if (nameSpan != null) {
    return nameSpan.innerText;
  }
  return null;
}

function delay(n) {
  n = n || 2000;
  return new Promise(done => {
    setTimeout(() => {
      done();
    }, n);
  });
}