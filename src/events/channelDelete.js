const { ChannelType, GuildChannel } = require("discord.js");
const { Takachi } = require("../libs/Client");

/**
 *
 * @param {Takachi} client
 * @param {GuildChannel} channel
 */
module.exports = async (client, channel) => {
  client.saveDeletedChannel(channel);
};
