const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rinomina')
    .setDescription('Rinomina il canale del ticket corrente')
    .addStringOption(opt =>
      opt.setName('nome').setDescription('Nuovo nome del ticket').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const data = client.ticketData.get(interaction.channel.id);
    if (!data) {
      return interaction.reply({ content: '❌ Questo comando funziona solo all\'interno di un ticket.', ephemeral: true });
    }

    const newName = interaction.options.getString('nome').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);

    await interaction.channel.setName(`ticket-${newName}`);
    await interaction.reply({ content: `✅ Ticket rinominato in **ticket-${newName}**.` });
  },
};
