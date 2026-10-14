const config = require("../config");
const { formatUptime } = require("../lib/utils");
module.exports = {
  name: "alive",
  aliases: ["bot", "online"],
  category: "main",
  desc: "Check if the bot is running",
  run: async ({ sock, from, msg, reply }) => {
    const text = `*${config.BOT_NAME}*\n\n${config.ALIVE_MSG}\n\n⏱️ Uptime: ${formatUptime(process.uptime())}\n⚙️ Mode: ${config.MODE}\n\n${config.FOOTER}`;
    try {
      await sock.sendMessage(from, { image: { url: config.ALIVE_IMAGE_URL }, caption: text }, { quoted: msg });
    } catch (e) {
      await reply(text);
    }
  },
};
