// Session site: gives the user a SESSION_ID (pair code or QR).
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pino = require("pino");
const QRCode = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const config = require("./config");
const { encode } = require("./lib/session");

const logger = pino({ level: "silent" });
const TMP = path.join(__dirname, "tmp_sessions");
const sessions = new Map();
const hits = new Map(); // ip -> [timestamps]
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (list.length >= 6) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

function finish(s, status, error) {
  if (s.status === "linked") return;
  s.status = status;
  s.error = error || null;
  closeSocket(s);
}

function closeSocket(s) {
  s.closed = true;
  clearTimeout(s.timer);
  try { s.sock?.end(undefined); } catch (e) {}
  setTimeout(() => fs.rmSync(s.dir, { recursive: true, force: true }), 3000);
  setTimeout(() => sessions.delete(s.id), 10 * 60 * 1000); // keep result 10 min for the page
}

async function onLinked(s, sock) {
  if (s.status === "linked" || s.closed) return;
  await delay(3000); // let creds.json finish writing
  try {
    s.sessionId = encode(path.join(s.dir, "creds.json"));
  } catch (e) {
    return finish(s, "error", "Could not read the session. Please try again.");
  }
  s.status = "linked";
  const me = sock.user.id.split(":")[0].split("@")[0] + "@s.whatsapp.net";
  try {
    await sock.sendMessage(me, {
      text: `*${config.BOT_NAME}*\n\nYour SESSION_ID 👇\n\n${s.sessionId}\n\n⚠️ Never share this with anyone. It gives full access to your WhatsApp.`,
    });
  } catch (e) {}
  await delay(2000);
  closeSocket(s); // end the socket WITHOUT logging out
}

async function connect(s) {
  const { state, saveCreds } = await useMultiFileAuthState(s.dir);
  let version;
  try { ({ version } = await fetchLatestBaileysVersion()); } catch (e) {}

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    markOnlineOnConnect: false,
  });
  s.sock = sock;
  sock.ev.on("creds.update", saveCreds);

  if (s.number && !state.creds.registered && !s.codeRequested) {
    s.codeRequested = true;
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(s.number);
        s.code = code.match(/.{1,4}/g).join("-");
        s.status = "waiting";
      } catch (e) {
        finish(s, "error", "Could not get a pairing code: " + e.message);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr && !s.number) {
      s.qr = await QRCode.toDataURL(qr);
      s.status = "waiting";
    }
    if (connection === "open") await onLinked(s, sock);
    if (connection === "close" && !s.closed && s.status !== "linked") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.restartRequired) return connect(s); // normal right after pairing
      finish(s, "error", `Linking failed or expired (code ${code}). Please try again.`);
    }
  });
}

async function createSession(number) {
  const active = [...sessions.values()].filter((s) => !s.closed).length;
  if (active >= 8) throw new Error("Server is busy. Try again in a minute.");
  const id = crypto.randomBytes(6).toString("hex");
  const s = { id, number, status: "starting", code: null, qr: null, sessionId: null, error: null, closed: false, dir: path.join(TMP, id) };
  sessions.set(id, s);
  s.timer = setTimeout(() => finish(s, "error", "Timed out. Please try again."), 4 * 60 * 1000);
  await connect(s);
  return s;
}

app.post("/api/pair", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many tries. Wait a few minutes." });
  const number = String(req.body.number || "").replace(/\D/g, "");
  if (number.length < 8 || number.length > 15) return res.status(400).json({ error: "Enter your number with country code, e.g. 94771234567" });
  try { res.json({ id: (await createSession(number)).id }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/qr", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many tries. Wait a few minutes." });
  try { res.json({ id: (await createSession(null)).id }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/status/:id", (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ status: "error", error: "Session expired. Start again." });
  res.json({ status: s.status, code: s.code, qr: s.qr, sessionId: s.sessionId, error: s.error });
});

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Session site running on port ${PORT}`));
