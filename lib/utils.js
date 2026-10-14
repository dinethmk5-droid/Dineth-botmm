function formatUptime(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600),
    m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [d && d + "d", h && h + "h", m && m + "m", s + "s"].filter(Boolean).join(" ");
}
const numberOf = (jid = "") => jid.split("@")[0].split(":")[0];
module.exports = { formatUptime, numberOf };
