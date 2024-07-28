const { Takachi } = require("../libs/Client");
const Worker = require("../libs/Worker");
const { Message } = require("discord.js");
/**
 * @param {Takachi} client
 * @param {Message} message
 * @param {Worker} worker
 * @returns
 */

module.exports = async (client, message, worker) => {
  if (!message.content.startsWith(client.config.prefix) || message.author.bot)
    return;
  if (
    !message.member.id.includes(message.guild.ownerId) ||
    !client.config.ownerID.includes(message.author.id)
  )
    return;

  const args = message.content
    .slice(client.config.prefix.length)
    .trim()
    .split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.get(client.aliases.get(commandName));

  if (!command) return;

  const worker = client.getAvailableWorker();
  if (!worker) {
    message.reply("Şu anda müsait işleyici bot yok.");
    return;
  }
  if (command) {
    command.onRequest(client, message, args, worker);
  }
  try {
    await worker.executeTask(command, message, args);
  } catch (error) {
    client.logger.error(error);
    message.reply("Bu komutu yürütürken bir hata oluştu.");
  }
};
