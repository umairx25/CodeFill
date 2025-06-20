
/** Save the address */
async function setToken(token) {
    console.warn("setToken has been called with token value of: ", token)
    await chrome.storage.local.set({ ["token"]: token });
  }
  
  
  /** Fetch it later (undefined if never stored) */
  async function getToken() {
    const obj = await chrome.storage.local.get("token");
  
    if (!obj["token"]) {
      // maybe fetch or construct a new token here
      console.warn("Token not found: ", obj["token"])
      return;
    }

    console.warn("Token retrieved: ", obj["token"])
  
    return obj["token"];
  }



//   const loginButton = document.getElementByID("login");
//   loginButton.addEventListener(getToken);
document.addEventListener("DOMContentLoaded", () => {
    const tokenButton = document.getElementById("tokenbutton");
    if (tokenButton) {
      tokenButton.addEventListener("click", async () => {
        const token = await getToken();
        console.log("Token in variable:", token);
        // Do something with it here
      });
    }
  });
  