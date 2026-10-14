const config = require("../config");
module.exports = {
  name: "mode",
  category: "owner",
  desc: "Owner only: .mode public | private",
  run: async ({ args, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Owner only command.");
    const m = (args[0] || "").toLowerCase();
    if (!["public", "private"].includes(m)) return reply(`Current mode: *${config.MODE}*\nUsage: ${config.PREFIX}mode public | private`);
    config.MODE = m;
    await reply(`✅ Mode changed to *${m}* (resets to the MODE env value on restart)`);
  },
};
