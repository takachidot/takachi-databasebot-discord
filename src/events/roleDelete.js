const { Role } = require("discord.js");
const { Takachi } = require("../libs/Client");

/**
 * @param {Takachi} client
 * @param {Role} role
 */

module.exports = async (client, role) => {
  await client.saveDeletedRole(role);
};
