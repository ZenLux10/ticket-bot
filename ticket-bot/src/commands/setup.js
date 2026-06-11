const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Invia il pannello di apertura ticket nel canale corrente')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema di Supporto')
      .setDescription(
        '**Hai bisogno di aiuto?**\n\n' +
        '> Clicca il bottone qui sotto per aprire un ticket.\n' +
        '> Il nostro staff ti risponderà il prima possibile.\n\n' +
        '**Categorie disponibili:**\n' +
        '🛠️ Supporto Generale\n' +
        '🐛 Segnalazione Bug\n' +
        '❓ Domanda\n' +
        '📋 Altro\n\n' +
        '⚠️ *Apri un ticket solo per motivi validi.*'
      )
      .setColor(0x5865f2)
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket_menu')
        .setLabel('Apri un Ticket')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Pannello ticket inviato!', ephemeral: true });
  },
};
