const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mostra le statistiche dei ticket del server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const tickets = [...client.ticketData.values()];
    const open = tickets.filter(t => t.status === 'open').length;
    const closed = tickets.filter(t => t.status === 'closed').length;

    const catCounts = {};
    for (const t of tickets) {
      catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Statistiche Ticket')
      .addFields(
        { name: '🟢 Aperti', value: `${open}`, inline: true },
        { name: '🔴 Chiusi', value: `${closed}`, inline: true },
        { name: '📦 Totale', value: `${tickets.length}`, inline: true },
        {
          name: '📂 Per Categoria',
          value: Object.entries(catCounts).map(([k, v]) => `**${k}**: ${v}`).join('\n') || 'Nessuno',
        }
      )
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
