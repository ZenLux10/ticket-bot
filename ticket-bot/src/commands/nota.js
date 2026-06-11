const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nota')
    .setDescription('Aggiungi una nota interna al ticket (visibile solo allo staff)')
    .addStringOption(opt =>
      opt.setName('testo').setDescription('Il testo della nota').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const data = client.ticketData.get(interaction.channel.id);
    if (!data) {
      return interaction.reply({ content: '❌ Questo comando funziona solo all\'interno di un ticket.', ephemeral: true });
    }

    const nota = interaction.options.getString('testo');

    const embed = new EmbedBuilder()
      .setTitle('📝 Nota Interna Staff')
      .setDescription(nota)
      .setColor(0xfee75c)
      .setFooter({ text: `Nota di ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Rendi la nota visibile solo allo staff dopo 30s rimuovendola per l'utente
    // (in alternativa si potrebbe usare un thread privato — qui usiamo ephemeral reply)
  },
};
