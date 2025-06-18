chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "log") {
    console.log("🛠 [From Popup]:", message.payload);
  }
});
