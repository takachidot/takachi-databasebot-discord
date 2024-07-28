const { Message, Role, ChannelType } = require("discord.js");
const { Takachi } = require("../libs/Client");
const Worker = require("../libs/Worker");

module.exports = {
  name: "geriYükle",
  aliases: ["redownload"],
  description: "Yedeklenen verileri geri yükler.",
  /**
   * @param {Takachi} client
   * @param {Message} message
   * @param {Array<String>} args
   * @param {Worker} worker
   * @returns
   */
  onRequest: async (client, message, args, worker) => {
    try {
      const deletedRoles = client.db.get("deletedRoles") || [];
      const deletedChannels = client.db.get("deletedChannels") || [];

      if (deletedRoles.length === 0 && deletedChannels.length === 0) {
        return message.reply("Geri yüklemek için hiçbir veri bulunmuyor.");
      }

      for (const roleData of deletedRoles) {
        const {
          guild,
          name,
          color,
          hoist,
          position,
          permissions,
          mentionable,
          memberIds,
        } = roleData;

        try {
          const newRole = await guild.roles.create({
            name,
            color,
            hoist,
            position,
            permissions,
            mentionable,
            reason: "Silinen rolü tekrar oluşturma",
          });
          
          if (worker) {
            await worker.createRole(newRole, memberIds);
          }

          message.channel.send(`Rol ${name} başarıyla geri yüklendi.`);
        } catch (error) {
          worker.logger.error(`Rolü geri yüklerken hata oluştu: ${error}`);
          message.channel.send(`Rol ${name} geri yüklenirken bir hata oluştu.`);
        }
      }

      for (const channelData of deletedChannels) {
        const { guild, name, type, position, parentId } = channelData;

        try {
          let parent = null;
          if (parentId) {
            parent = await guild.channels.fetch(parentId);
          }

          await guild.channels.create(name, {
            type: type,
            position: position,
            parent: parent || null,
          });

          message.channel.send(`Kanal ${name} başarıyla geri yüklendi.`);
        } catch (error) {
          client.logger.error(`Kanali geri yüklerken hata oluştu: ${error}`);
          message.channel.send(
            `Kanal ${name} geri yüklenirken bir hata oluştu.`,
          );
        }
      }

      client.db.set("deletedRoles", []);
      client.db.set("deletedChannels", []);
    } catch (error) {
      console.error(error);
    } finally {
      message.react("✅");
    }
  },
};
