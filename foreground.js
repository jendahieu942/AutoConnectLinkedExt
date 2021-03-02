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
const SR_CLOSE_CONNECT_MODAL = "button.artdeco-modal__dismiss.artdeco-button.artdeco-button--circle.artdeco-button--muted.artdeco-button--2.artdeco-button--tertiary.ember-view";

const NEXT_PAGE_BTN = "button.artdeco-pagination__button.artdeco-pagination__button--next.artdeco-button.artdeco-button--muted.artdeco-button--icon-right.artdeco-button--1.artdeco-button--tertiary.ember-view"

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
  console.log("I got message");
  msgTemplate = message.msg_template;
  minDelay = message.min_time_delay;
  maxDelay = message.max_time_delay;
  maxConnect = message.max_user_connect;

  action();
}

function action() {
  console.log("doing = " + doing);
  setTimeout(() => {
    let rsList = document.querySelectorAll(`div.${SR_ITEM_DIV_CLASS}`);
    console.log(rsList.length);
    if (!doing) actionForList(rsList, i); /// bugs
    if (current_connection > 0 && (current_connection % 10 == 0 || !doing)) {
      window.scrollBy(0, 500);
    }
    if (current_connection < maxConnect && !doing) {
      if (retries++ == 100) return;
      let nextPageBtn = document.querySelector(NEXT_PAGE_BTN);
      console.log(nextPageBtn);
      if (nextPageBtn) {
        nextPageBtn.click();
        console.log("Oping next page");
        i = 0;
      } else {
        console.log("No Next Page");
      }
      action();
    }
  }, 10000);
}

function actionForList(resultList, it) {
  doing = true;
  setTimeout(() => {
    let item = resultList[it];
    if (it >= resultList.length) {
      doing = false;
      return;
    }
    connectToUserItem(item, msgTemplate);
    if (current_connection >= maxConnect) {
      doing = false;
      return;
    }
    console.log('current = ' + current_connection);
    if (it++ < resultList.length) {
      actionForList(resultList, it);
    }
  }, getRandomMilisecond(minDelay, maxDelay));
  console.log("i am doing = " + doing);
}

// FUNCTION TO ACTION CONNECT TO USER
function connectToUserItem(item, messageTemplate) {
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
    setTimeout(() => {
      let content = messageTemplate.replace("#NAME", userName);
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
          setTimeout(() => {
            let sendNoteBtn = document.querySelector(SR_SEND_NOTE_BTN);
            if (sendNoteBtn) {
              console.log(sendNoteBtn); // TODO: click

              // CLOSE MODAL
              setTimeout(() => {
                let closeBtn = document.querySelector(SR_CLOSE_CONNECT_MODAL);
                console.log(closeBtn);
                if (closeBtn) {
                  closeBtn.click();
                  current_connection += 1;
                }
              }, 200);
            }
          }, 500);
        }
      }
    }, 500);
  }
}

function getRandomMilisecond(min, max) {
  return parseInt((Math.random() * (max - min + 1) + min) * 1000);
}

function getNameFromItem(item) {
  console.log("Get Name");
  let nameSpan = item.querySelector(SR_NAME_SELECTOR);
  if (nameSpan != null) {
    return nameSpan.innerText;
  }
  return null;
}
