const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ChannelType,
} = require("discord.js");
const { Database } = require("vlodia");
const { glob } = require("glob");
const { promisify } = require("util");
const path = require("path");

const globPromise = promisify(glob);

const { Logger } = require("@vlodia/logger");

class Takachi extends Client {
  constructor() {
    super({
      intents: Object.values(GatewayIntentBits),
      partials: Object.values(Partials),
    });

    this.config = global.config = require("../utils/config.json");
    this.db = global.db = new Database("../utils/database.json");

    this.commands = new Collection();
    this.aliases = new Collection();

    this.workers = [];

    this.logger = global.cordLogger = new Logger("[MAINBOT]:");

    this.initialize();
  }

  async initialize() {
    await this.fetchCommands();
    await this.fetchEvents();
    this.login(this.config.Token).then(() => {
      this.user.setPresence({
        activities: [{ name: "takachi was here." }],
        status: "idle",
      });
      this.logger.log();
    });
  }

  async fetchCommands() {
    const commandFiles = await globPromise(
      path.join(__dirname, "..", "commands", "**", "*.js"),
    );

    for (const file of commandFiles) {
      const command = require(file);
      if (command.name) {
        this.commands.set(command.name, command);
      }
      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          this.aliases.set(alias, command.name);
        }
      }
    }
  }

  async fetchEvents() {
    const eventFiles = await globPromise(
      path.join(__dirname, "..", "events", "**", "*.js"),
    );

    for (const file of eventFiles) {
      const event = require(file);
      const eventName = file.split("/").pop().split(".")[0];
      this.on(eventName, event.bind(null, this));
    }
  }

  getAvailableWorker() {
    return this.workers.find((worker) => worker.isAvailable());
  }

  addWorker(worker) {
    this.workers.push(worker);
  }
  async assignRoleCreation(roleData, memberIds) {
    const worker = this.getAvailableWorker();
    if (!worker) {
      this.logger.error("Şu anda müsait işleyici bot yok.");
      return;
    }
    await worker.createRole(roleData, memberIds);
  }

  async saveDeletedRole(role) {
    const roleData = {
      id: role.id,
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      position: role.position,
      permissions: role.permissions,
      mentionable: role.mentionable,
      members: role.members.map((member) => member.id),
    };

    let deletedRoles = this.db.get("deletedRoles") || [];
    if (deletedRoles.length >= 30) {
      deletedRoles.shift();
    }
    deletedRoles.push(roleData);
    this.db.set("deletedRoles", deletedRoles, {
      pretty: true,
      write: true,
    });
  }

  getDeletedRoles() {
    return this.db.get("deletedRoles") || [];
  }

  async assignChannelCreation(channelData) {
    const worker = this.getAvailableWorker();
    if (!worker) {
      this.logger.error("Şu anda müsait işleyici bot yok.");
      return;
    }
    await worker.createChannel(channelData);
  }

  async saveDeletedChannel(channel) {
    const channelData = {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      position: channel.position,
      parentId: [
        ChannelType.GuildStageVoice,
        ChannelType.GuildVoice,
        ChannelType.GuildForum,
        ChannelType.GuildNews,
        ChannelType.GuildText,
      ].includes(channel.type)
        ? channel.parentId
        : null,
    };

    let deletedChannels = this.db.get("deletedChannels") || [];
    if (deletedChannels.length >= 30) {
      deletedChannels.shift();
    }
    deletedChannels.push(channelData);
    this.db.set("deletedChannels", deletedChannels, {
      pretty: true,
      write: true,
    });
  }

  getDeletedChannels() {
    return this.db.get("deletedChannels") || [];
  }
}

exports.Takachi = Takachi;
