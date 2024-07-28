const { Message } = require("discord.js");
const { Takachi } = require("../libs/Client");
const Worker = require("../libs/Worker");

module.exports = {
  name: "kanalkur",
  aliases: ["kanal-kur"],
  description: "Silinen bir kanalı yeniden oluştur.",
  /**
   *
   * @param {Takachi} client
   * @param {Message} message
   * @param {Array<String>} args
   * @param {Worker} worker
   * @returns
   */
  onRequest: async (client, message, args, worker) => {
    const deletedChannels = client.db.get("deletedChannels");

    if (!deletedChannels || deletedChannels.length === 0) {
      return message.channel.send(
        "Son 30 gün içinde silinen kanal bulunamadı.",
      );
    }

    let response = "Son 30 günde silinen kanallar:\n";
    deletedChannels.forEach((channel, index) => {
      response += `${index + 1}. ${channel.name} (ID: ${channel.id})\n`;
    });
    response += "\nBir kanalı yeniden oluşturmak için sayı girin:";

    message.channel.send(response);

    const filter = (m) =>
      m.author.id === message.author.id &&
      !isNaN(m.content) &&
      m.content > 0 &&
      m.content <= deletedChannels.length;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (m) => {
      const selectedChannel = deletedChannels[m.content - 1];
      const guild = message.guild;
      await client.assignChannelCreation(selectedChannel);

      message.react("✅");
      client.db.set(
        "deletedChannels",
        deletedChannels.filter((channel) => channel.id !== selectedChannel.id),
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
