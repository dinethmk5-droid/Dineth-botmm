const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PREFIX = "DINETH~";

// creds.json -> "DINETH~<gzip+base64>"
function encode(credsPath) {
  const raw = fs.readFileSync(credsPath);
  return PREFIX + zlib.gzipSync(raw).toString("base64");
}

// SESSION_ID -> <dir>/creds.json
function restore(sessionId, dir) {
  if (!sessionId) return false;
  const b64 = sessionId.trim().replace(PREFIX, "");
  const json = zlib.gunzipSync(Buffer.from(b64, "base64"));
  JSON.parse(json.toString()); // validate
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "creds.json"), json);
  return true;
}

module.exports = { encode, restore, PREFIX };
