const { Message } = require("discord.js");
const { Takachi } = require("../libs/Client");
const Worker = require("../libs/Worker");

module.exports = {
  name: "rolkur",
  aliases: ["rol-kur"],
  description: "Silinen bir rolü yeniden oluştur.",
  /**
   *
   * @param {Takachi} client
   * @param {Message} message
   * @param {Array<String>} args
   * @param {Worker} worker
   * @returns
   */
  onRequest: async (client, message, args, worker) => {
    const deletedRoles = client.db.get("deletedRoles");

    if (!deletedRoles || deletedRoles.length === 0) {
      return message.channel.send("Son 30 gün içinde silinen rol bulunamadı.");
    }

    let response = "Son 30 günde silinen roller:\n";
    deletedRoles.forEach((role, index) => {
      response += `${index + 1}. ${role.name} (ID: ${role.id})\n`;
    });
    response += "\nBir rolü yeniden oluşturmak için sayı girin:";

    message.channel.send(response);

    const filter = (m) =>
      m.author.id === message.author.id &&
      !isNaN(m.content) &&
      m.content > 0 &&
      m.content <= deletedRoles.length;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (m) => {
      const selectedRole = deletedRoles[m.content - 1];
      await client.assignRoleCreation(selectedRole);

      message.react("✅");
      client.db.set(
        "deletedRoles",
        deletedRoles.filter((role) => role.id !== selectedRole.id),
        {
          pretty: true,
          write: true,
        },
      );
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        message.channel.send("Zaman aşımına uğradı. Lütfen tekrar deneyin.");
      }
    });
  },
};
