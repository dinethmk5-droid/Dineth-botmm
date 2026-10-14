// One repo, two modes:
//  - SESSION_ID is set   -> run the WhatsApp bot
//  - SESSION_ID is empty -> run the session (pair code / QR) site
if (process.env.SESSION_ID && process.env.SESSION_ID.trim()) {
  require("./index.js");
} else {
  console.log("No SESSION_ID found -> starting the session site.");
  require("./server.js");
}
