const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');
const { getTicketAdvice, extractTicketMessages } = require('../utils/groq');

const CATEGORIES_LABELS = {
  support: '🛠️ Supporto Generale',
  bug: '🐛 Segnalazione Bug',
  question: '❓ Domanda',
  other: '📋 Altro',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('consiglio')
    .setDescription('🤖 Ricevi via DM un consiglio AI su come risolvere questo ticket'),

  async execute(interaction, client) {
    const guildId = interaction.guildId;
    const config = getConfig(guildId);

    const allowedRoleId = config.consigliRoleId || config.staffRoleId;
    if (!allowedRoleId) {
      return interaction.reply({ content: '❌ Nessun ruolo configurato. Usa `/configura` per impostare il ruolo staff.', ephemeral: true });
    }

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({ content: '❌ Non hai il ruolo necessario per usare questo comando.', ephemeral: true });
    }

    const ticketData = client.ticketData.get(interaction.channel.id);
    if (!ticketData) {
      return interaction.reply({ content: '❌ Questo comando funziona solo all\'interno di un ticket.', ephemeral: true });
    }

    await interaction.reply({ content: '🤖 Sto analizzando il ticket, riceverai un DM tra pochi secondi...', ephemeral: true });

    try {
      const ticketContent = await extractTicketMessages(interaction.channel, 60);
      const categoryLabel = CATEGORIES_LABELS[ticketData.category] || ticketData.category;
      const groqKey = config.groqApiKey || process.env.GROQ_API_KEY;
      const advice = await getTicketAdvice(ticketContent, categoryLabel, groqKey);

      const dmEmbed = new EmbedBuilder()
        .setTitle('🤖 Consiglio AI — Ticket Support')
        .setDescription(advice)
        .addFields(
          { name: '🎫 Ticket', value: `${interaction.channel}`, inline: true },
          { name: '📂 Categoria', value: categoryLabel, inline: true },
          { name: '👤 Proprietario', value: ticketData.ownerId ? `<@${ticketData.ownerId}>` : 'Sconosciuto', inline: true },
        )
        .setColor(0x5865f2)
        .setFooter({ text: `Powered by Groq AI • ${interaction.guild.name}` })
        .setTimestamp();

      await interaction.user.send({ embeds: [dmEmbed] });
      await interaction.editReply({ content: '✅ Ti ho inviato il consiglio in DM!' });

    } catch (err) {
      console.error('Errore /consiglio:', err);
      let errMsg = '❌ Si è verificato un errore.';
      if (err.message.includes('Groq API')) errMsg = `❌ Errore API Groq: ${err.message}`;
      if (err.message.includes('chiave API')) errMsg = `❌ ${err.message}`;
      if (err.code === 50007) errMsg = '❌ Non riesco a inviarti un DM. Controlla di avere i DM aperti.';
      await interaction.editReply({ content: errMsg });
    }
  },
};
