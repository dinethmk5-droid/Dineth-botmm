module.exports = {
  name: "ping",
  aliases: ["speed"],
  category: "main",
  desc: "Check response speed",
  run: async ({ msg, reply }) => {
    const sent = Number(msg.messageTimestamp) * 1000;
    const ms = Math.max(0, Date.now() - sent);
    await reply(`🏓 Pong! ${ms} ms`);
  },
};
