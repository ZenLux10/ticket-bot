const { Events } = require('discord.js');
const ticketHandler = require('../handlers/ticketHandler');
const configuraCmd = require('../commands/configura');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {

    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const msg = { content: '❌ Errore durante l\'esecuzione del comando.', ephemeral: true };
        interaction.replied || interaction.deferred
          ? await interaction.followUp(msg)
          : await interaction.reply(msg);
      }
      return;
    }

    // Bottoni
    if (interaction.isButton()) {
      // Bottoni configurazione
      if (interaction.customId.startsWith('cfg_')) {
        return configuraCmd.handleConfigButton(interaction, client);
      }
      // Bottoni ticket
      return ticketHandler.handleButton(interaction, client);
    }

    // Select menu
    if (interaction.isStringSelectMenu()) {
      return ticketHandler.handleSelect(interaction, client);
    }

    // Modal
    if (interaction.isModalSubmit()) {
      // Modali configurazione
      if (interaction.customId.startsWith('cfg_modal_')) {
        return configuraCmd.handleConfigModal(interaction, client);
      }
      // Modali ticket
      return ticketHandler.handleModal(interaction, client);
    }
  },
};
