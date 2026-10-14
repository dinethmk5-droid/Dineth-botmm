const config = require("../config");
module.exports = {
  name: "owner",
  aliases: ["creator"],
  category: "main",
  desc: "Send the owner's contact",
  run: async ({ sock, from, msg }) => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${config.OWNER_NAME}\nTEL;type=CELL;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\nEND:VCARD`;
    await sock.sendMessage(from, { contacts: { displayName: config.OWNER_NAME, contacts: [{ vcard }] } }, { quoted: msg });
  },
};
