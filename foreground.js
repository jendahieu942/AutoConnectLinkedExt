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

chrome.runtime.onMessage.addListener(gotMessage);

// FUNCTIONS
function gotMessage(message, sender, sendResponse) {
  console.log("I got message");
  console.log("Msg template: " + message.msg_template);
  console.log("Min time delay: " + message.min_time_delay);
  console.log("Max time delay: " + message.max_time_delay);
  console.log("Max user connect: " + message.max_user_connect);

  var rsList = document.querySelectorAll(`div.${SR_ITEM_DIV_CLASS}`);
  console.log(rsList.length);
  let userName = getNameFromItem(rsList[0]);
  clickConnect(rsList[0], message.msg_template);
}

function getRandomMilisecond(min, max) {
  return parseInt((Math.random() * (max - min + 1) + min) * 1000);
}

function getNameFromItem(item) {
  return item.querySelector(SR_NAME_SELECTOR).innerText;
}

function clickConnect(item, messageTemplate) {
  let connectButton = item.querySelector(SR_CONNECT_BTN_SELECTOR);
  setTimeout(() => {
    connectButton.click();
  }, 500);
  let userName = getNameFromItem(item);
  setTimeout(() => {
      addNote(messageTemplate, userName);
  }, 500);
  return true;
}

function addNote(template, userName) {
  let content = template.replace("#NAME", userName);
  let addNoteBtn = document.querySelector(SR_ADD_NOTE_BTN_SELECTOR);
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

      let sendNoteBtn = document.querySelector(SR_SEND_NOTE_BTN);
      setTimeout(() => {
          console.log(sendNoteBtn);
      }, 500);
    } else {
      // TODO:
    }
  }, 500);
}
