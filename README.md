<p align="center"><img src="https://files.catbox.moe/20uiui.png" width="200"></p>

<h1 align="center">𝑫𝑰𝑵𝑬𝑻𝑯_𝑴𝑫_𝑴𝒊𝒏𝒊_𝑩𝒐𝒕</h1>

WhatsApp bot (Baileys) + its own **session site** (pair code / QR).
One repo, two modes (`start.js` decides):

| `SESSION_ID` env | What runs |
|---|---|
| empty | Session site (get your SESSION_ID) |
| set | The WhatsApp bot |

## 1) Get your SESSION_ID
1. Deploy / run this repo **without** `SESSION_ID` (see below), open the site URL.
2. **Pair code tab**: type your number with country code (`94771234567`) → *Get pair code*.
3. WhatsApp → Settings → Linked devices → Link a device → **Link with phone number instead** → enter the code.
4. Your `DINETH~...` SESSION_ID appears on the page and is also sent to your own WhatsApp chat. Copy it.
   (QR tab works the same, but you need a second phone to scan.)

## 2) Run the bot
Set these environment variables, then (re)start:
- `SESSION_ID` = the value you copied
- `OWNER_NUMBER` = your number (digits only, with country code)
- optional: `OWNER_NAME`, `PREFIX` (default `.`), `MODE` (`public`/`private`), `AUTO_STATUS_SEEN`

Commands: `.menu` `.alive` `.ping` `.owner` `.mode`
Menu / alive image: `MENU_IMAGE_URL`, `ALIVE_IMAGE_URL` (default = the catbox picture).

## Where to run
- **Phone (Termux) / PC**: `npm install` then `npm start`.
- **Heroku / Railway / Koyeb**: push this repo to GitHub and deploy (Dockerfile or Procfile included).

## Add a command
Create `commands/hello.js`:
```js
module.exports = { name: "hello", category: "fun", desc: "Say hi",
  run: async ({ reply }) => reply("Hi!") };
```

⚠️ A SESSION_ID gives full access to the WhatsApp account. Never share it or commit it to GitHub.
