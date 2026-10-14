// All values can be overridden with environment variables.
module.exports = {
  BOT_NAME: process.env.BOT_NAME || "𝑫𝑰𝑵𝑬𝑻𝑯_𝑴𝑫_𝑴𝒊𝒏𝒊_𝑩𝒐𝒕",
  SESSION_ID: process.env.SESSION_ID || "",
  PREFIX: process.env.PREFIX || ".",
  OWNER_NAME: process.env.OWNER_NAME || "Dineth",
  // country code + number, digits only (example: 94771234567)
  OWNER_NUMBER: (process.env.OWNER_NUMBER || "94700000000").replace(/\D/g, ""),
  // public = everyone can use commands, private = only the owner
  MODE: (process.env.MODE || "public").toLowerCase(),
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/20uiui.png",
  ALIVE_IMAGE_URL: process.env.ALIVE_IMAGE_URL || "https://files.catbox.moe/20uiui.png",
  ALIVE_MSG: process.env.ALIVE_MSG || "I'm alive and running 🤖",
  FOOTER: process.env.FOOTER || "© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝑫𝑰𝑵𝑬𝑻𝑯_𝑴𝑫_𝑴𝒊𝒏𝒊_𝑩𝒐𝒕",
  AUTO_STATUS_SEEN: (process.env.AUTO_STATUS_SEEN || "false") === "true",
};
