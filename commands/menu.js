const config = require("../config");
module.exports = {
  name: "menu",
  aliases: ["help", "list"],
  category: "main",
  desc: "Show all commands",
  run: async ({ sock, from, msg, commands, reply }) => {
    const groups = {};
    for (const c of new Set(commands.values())) (groups[c.category || "other"] ||= []).push(c);
    let text = `╭━━━〔 *${config.BOT_NAME}* 〕━━━╮\n┃ 👤 Owner : ${config.OWNER_NAME}\n┃ ⚙️ Mode  : ${config.MODE}\n┃ 🔰 Prefix: ${config.PREFIX}\n╰━━━━━━━━━━━━━━━━━━╯\n`;
    for (const [cat, list] of Object.entries(groups)) {
      text += `\n*❖ ${cat.toUpperCase()}*\n`;
      for (const c of list) text += `  ◦ ${config.PREFIX}${c.name} - ${c.desc}\n`;
    }
    text += `\n${config.FOOTER}`;
    try {
      await sock.sendMessage(from, { image: { url: config.MENU_IMAGE_URL }, caption: text }, { quoted: msg });
    } catch (e) {
      await reply(text); // fallback if the image can't be loaded
    }
  },
};
