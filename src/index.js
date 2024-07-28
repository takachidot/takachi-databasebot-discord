const { Takachi } = require("./libs/Client");
const Worker = require("./libs/Worker");
const client = (global.client = new Takachi());
client.config.workerToken.forEach((token) => {
  new Worker(client, token);
});

client.initialize();
