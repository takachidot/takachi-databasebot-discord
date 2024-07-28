const {
  Client,
  GatewayIntentBits,
  Partials,
  Role,
  GuildChannel,
} = require("discord.js");
const { Logger } = require("@vlodia/logger");

class Worker extends Client {
  constructor(coordinator, token) {
    super({
      intents: Object.values(GatewayIntentBits),
      partials: Object.values(Partials),
    });

    this.coordinator = coordinator;
    this.token = token;
    this.available = false;
    this.logger = global.workerLogger = new Logger("[WORKER]:");
    this.initialize();
  }

  async initialize() {
    this.on("ready", () => {
      this.logger.log(`Worker bot ${this.user.tag} giriş yaptı.`);
      this.coordinator.addWorker(this);
      this.user.setPresence({
        status: "invisible",
      });
    });

    this.login(this.token);
  }

  isAvailable() {
    return this.available;
  }

  async executeTask(command, message, args) {
    this.available = true;
    this.user.setStatus("dnd");
    this.user.setPresence({
      activities: [{ name: "Calm Down!" }],
    });

    try {
      await command.onRequest(message, args);
    } catch (error) {
      this.logger.error(error);
    } finally {
      setTimeout(
        () => {
          this.user.setPresence({
            status: "invisible",
          });
          this.available = false;
          this.destroy();
        },
        5 * 60 * 1000,
      );
    }
  }

  /**
   *
   * @param {Role} roleData
   * @param {Array} memberIds
   */
  async createRole(roleData, memberIds) {
    this.available = false;

    const { guild, name, color, hoist, position, permissions, mentionable } =
      roleData;

    try {
      const newRole = await guild.roles.create({
        name: name,
        color: color,
        hoist: hoist,
        position: position,
        permissions: permissions,
        mentionable: mentionable,
        reason: "Silinen rolü tekrar oluşturma",
      });

      this.logger.log(`Rol ${name} tekrar oluşturuldu: ${newRole.id}`);

      memberIds.map(async (memberId) => {
        const member = await guild.members.fetch(memberId);
        if (member) {
          await member.roles.add(newRole);
        }
      });
    } catch (error) {
      this.logger.error(
        `Rolü tekrar oluştururken veya üyeye eklerken hata oluştu: ${error}`,
      );
    } finally {
      this.available = true;
    }
  }

  /**
   *
   * @param {GuildChannel} channelData
   */
  async createChannel(channelData) {
    this.available = false;

    const { guild, name, type, position, parentId } = channelData;

    try {
      let parent = null;
      if (parentId) {
        parent = await guild.channels.fetch(parentId);
      }

      const newChannel = await guild.channels.create(name, {
        type: type,
        position: position,
        parent: parent,
      });

      this.logger.log(`Kanal ${name} tekrar oluşturuldu: ${newChannel.id}`);
    } catch (error) {
      this.logger.error(`Kanalı tekrar oluştururken hata oluştu: ${error}`);
    } finally {
      this.available = true;
    }
  }
}

module.exports = Worker;
