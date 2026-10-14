const fs = require("fs");
const path = require("path");
const http = require("http");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  normalizeMessageContent,
} = require("@whiskeysockets/baileys");
const config = require("./config");
const { restore } = require("./lib/session");
const { numberOf } = require("./lib/utils");

const AUTH_DIR = path.join(__dirname, "auth");
const logger = pino({ level: "silent" });

// tiny web server so Heroku / Railway / Koyeb see an open port
http
  .createServer((req, res) => res.end(`${config.BOT_NAME} is running`))
  .listen(process.env.PORT || 3000);

// ---- load commands -------------------------------------------------------
const commands = new Map();
for (const file of fs.readdirSync(path.join(__dirname, "commands")).filter((f) => f.endsWith(".js"))) {
  const cmd = require(path.join(__dirname, "commands", file));
  commands.set(cmd.name, cmd);
  for (const a of cmd.aliases || []) commands.set(a, cmd);
}

// ---- message handler -----------------------------------------------------
async function handle(sock, msg) {
  if (!msg.message) return;
  const from = msg.key.remoteJid;

  if (from === "status@broadcast") {
    if (config.AUTO_STATUS_SEEN) await sock.readMessages([msg.key]).catch(() => {});
    return;
  }

  const m = normalizeMessageContent(msg.message);
  const text =
    m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || "";
  if (!text.startsWith(config.PREFIX)) return;

  const sender = msg.key.fromMe ? sock.user.id : msg.key.participant || from;
  const isOwner = msg.key.fromMe || numberOf(sender) === config.OWNER_NUMBER;
  if (config.MODE === "private" && !isOwner) return;

  const [name, ...args] = text.slice(config.PREFIX.length).trim().split(/\s+/);
  const cmd = commands.get((name || "").toLowerCase());
  if (!cmd) return;

  const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });
  try {
    await cmd.run({ sock, msg, from, sender, args, isOwner, commands, reply });
  } catch (e) {
    console.error(`Error in command ${name}:`, e);
    await reply("❌ Something went wrong while running that command.").catch(() => {});
  }
}

// ---- connection ----------------------------------------------------------
async function start() {
  if (!fs.existsSync(path.join(AUTH_DIR, "creds.json"))) {
    try {
      if (!restore(config.SESSION_ID, AUTH_DIR)) throw new Error("empty");
    } catch (e) {
      console.error("❌ SESSION_ID is missing or invalid. Generate a new one with the session site.");
      return;
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch (e) {}

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ ${config.BOT_NAME} connected as ${numberOf(sock.user.id)}`);
      const me = numberOf(sock.user.id) + "@s.whatsapp.net";
      sock
        .sendMessage(me, { text: `*${config.BOT_NAME}* connected ✅\nPrefix: ${config.PREFIX}  |  Mode: ${config.MODE}\nType ${config.PREFIX}menu` })
        .catch(() => {});
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.error("❌ Logged out from WhatsApp. Generate a new SESSION_ID and update the env variable.");
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        return;
      }
      console.log(`Connection closed (${code}). Reconnecting in 3s...`);
      setTimeout(start, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) await handle(sock, msg).catch((e) => console.error(e));
  });
}

start();
