const SR_ITEM_CARD = "div.entity-result__item";
const ALUMNI_ITEM_CARD = "li.org-people-profiles-module__profile-item";

const SR_NAME_SELECTOR = "span.entity-result__title-text.t-16 > a > span > span:nth-child(1)";
const ALUMNI_NAME_SELECTOR = "div.org-people-profile-card__profile-title.t-black.lt-line-clamp.lt-line-clamp--single-line.ember-view";

const CONNECT_BTN_SELECTOR =
  "button.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view";
const ADD_NOTE_BTN_SELECTOR =
  "button.mr1.artdeco-button.artdeco-button--muted.artdeco-button--3.artdeco-button--secondary.ember-view";
const NOTE_AREA_SELECTOR =
  "textarea.ember-text-area.ember-view.connect-button-send-invite__custom-message.mb3";
const SEND_NOTE_BTN =
  "button.ml1.artdeco-button.artdeco-button--3.artdeco-button--primary.ember-view";
const CLOSE_CONNECT_MODAL =
  "button.artdeco-modal__dismiss.artdeco-button.artdeco-button--circle.artdeco-button--muted.artdeco-button--2.artdeco-button--tertiary.ember-view";

const SR_NEXT_PAGE_BTN =
  "button.artdeco-pagination__button.artdeco-pagination__button--next.artdeco-button.artdeco-button--muted.artdeco-button--icon-right.artdeco-button--1.artdeco-button--tertiary.ember-view";

let ITEM_DIV_CLASS;
let NAME_SELECTOR;

let current_connection = 0;
let minDelay = 0;
let maxDelay = 0;
let maxConnect = 1;
let msgTemplate = "";
let pageType = "search";
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

  msgTemplate = data.msg_template;
  minDelay = data.min_time_delay;
  maxDelay = data.max_time_delay;
  maxConnect = data.max_user_connect;
  current_connection = data.current_connect ? data.current_connect : current_connection;
  pageType = data.page_type;

  console.log(pageType);

  ITEM_DIV_CLASS = pageType == "search" ? SR_ITEM_CARD : ALUMNI_ITEM_CARD;
  NAME_SELECTOR = pageType == "search" ? SR_NAME_SELECTOR : ALUMNI_NAME_SELECTOR;

  doing = (action == "start");
  if (doing) doAction();
}

async function doAction() {
  await delay(5000);
  let rawList = document.querySelectorAll(ITEM_DIV_CLASS);
  // Filter 
  let rsList = [];
  for (var j = 0; j < rawList.length; j++) {
    let rawItem = rawList[j];
    let connectButton = rawItem.querySelector(CONNECT_BTN_SELECTOR);
    if (connectButton && !connectButton.disabled) {
      rsList.push(rawItem);
    } else {
      console.log("Ignore user: " + getNameFromItem(rawItem));
    }
  }
  // Real action
  for (i = 0; i < rsList.length; i++) {
    if (!doing) {
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
      let nextPageBtn = document.querySelector(SR_NEXT_PAGE_BTN);
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
  let connectButton = item.querySelector(CONNECT_BTN_SELECTOR);
  if (connectButton) {
    // CLICK CONNECT
    connectButton.click();
    // ADD NOTE
    let content = msgTemplate.replace("#NAME", userName);
    let addNoteBtn = document.querySelector(ADD_NOTE_BTN_SELECTOR);
    if (addNoteBtn) {
      addNoteBtn.click();
      let inputTextArea = document.querySelector(NOTE_AREA_SELECTOR);
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
        let sendNoteBtn = document.querySelector(SEND_NOTE_BTN);
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
  let nameSpan = item.querySelector(NAME_SELECTOR);
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