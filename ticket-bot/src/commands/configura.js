const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { getConfig, setConfig } = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configura')
    .setDescription('⚙️ Configura tutto il bot ticket da qui')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const guildId = interaction.guildId;
    const config = getConfig(guildId);

    const statusEmbed = new EmbedBuilder()
      .setTitle('⚙️ Pannello di Configurazione Ticket Bot')
      .setDescription('Clicca un bottone per configurare quella sezione.\nTutti i campi accettano **ID** Discord.')
      .addFields({
        name: '📋 Configurazione Attuale',
        value: [
          `📢 Canale Ticket: ${config.ticketChannelId ? `<#${config.ticketChannelId}>` : '❌ Non impostato'}`,
          `📋 Canale Log: ${config.logChannelId ? `<#${config.logChannelId}>` : '❌ Non impostato'}`,
          `👥 Ruolo Staff: ${config.staffRoleId ? `<@&${config.staffRoleId}>` : '❌ Non impostato'}`,
          `🤖 Ruolo /consiglio: ${config.consigliRoleId ? `<@&${config.consigliRoleId}>` : '⬅️ Usa ruolo staff'}`,
          `📁 Categoria Ticket: ${config.ticketCategoryId ? `\`${config.ticketCategoryId}\`` : '❌ Non impostata'}`,
          `🔑 Groq API Key: ${config.groqApiKey ? '✅ Impostata' : '❌ Non impostata'}`,
        ].join('\n'),
      })
      .setColor(config.setupDone ? 0x57f287 : 0xfee75c)
      .setFooter({ text: `Server: ${interaction.guild.name} • ${config.setupDone ? '✅ Configurazione completata' : '⚠️ Incompleta'}` })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cfg_channels').setLabel('Canali').setEmoji('📢').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cfg_roles').setLabel('Ruoli').setEmoji('👥').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cfg_groq').setLabel('Groq API Key').setEmoji('🤖').setStyle(ButtonStyle.Primary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cfg_category').setLabel('Categoria Ticket').setEmoji('📁').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('cfg_setup_panel').setLabel('Invia Pannello Ticket').setEmoji('🎫').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('cfg_reset').setLabel('Reset Config').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [statusEmbed], components: [row1, row2], ephemeral: true });
  },

  async handleConfigButton(interaction, client) {
    const { customId } = interaction;
    const guildId = interaction.guildId;

    if (customId === 'cfg_channels') {
      const modal = new ModalBuilder().setCustomId('cfg_modal_channels').setTitle('⚙️ Configura Canali');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('ticket_channel_id').setLabel('ID Canale pannello ticket').setStyle(TextInputStyle.Short).setPlaceholder('1234567890123456789').setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('log_channel_id').setLabel('ID Canale Log').setStyle(TextInputStyle.Short).setPlaceholder('1234567890123456789').setRequired(true)
        ),
      );
      return interaction.showModal(modal);
    }

    if (customId === 'cfg_roles') {
      const modal = new ModalBuilder().setCustomId('cfg_modal_roles').setTitle('⚙️ Configura Ruoli');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('staff_role_id').setLabel('ID Ruolo Staff').setStyle(TextInputStyle.Short).setPlaceholder('1234567890123456789').setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('consigli_role_id').setLabel('ID Ruolo /consiglio (vuoto = staff)').setStyle(TextInputStyle.Short).setPlaceholder('1234567890123456789').setRequired(false)
        ),
      );
      return interaction.showModal(modal);
    }

    if (customId === 'cfg_category') {
      const modal = new ModalBuilder().setCustomId('cfg_modal_category').setTitle('⚙️ Configura Categoria');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('category_id').setLabel('ID Categoria per i ticket').setStyle(TextInputStyle.Short).setPlaceholder('1234567890123456789').setRequired(true)
        ),
      );
      return interaction.showModal(modal);
    }

    if (customId === 'cfg_groq') {
      const modal = new ModalBuilder().setCustomId('cfg_modal_groq').setTitle('🤖 Groq API Key');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('groq_key').setLabel('Groq API Key').setStyle(TextInputStyle.Short).setPlaceholder('gsk_...').setRequired(true)
        ),
      );
      return interaction.showModal(modal);
    }

    if (customId === 'cfg_setup_panel') {
      const config = getConfig(guildId);
      if (!config.ticketChannelId) {
        return interaction.reply({ content: '❌ Prima imposta il canale ticket con il bottone **Canali**.', ephemeral: true });
      }
      const ch = interaction.guild.channels.cache.get(config.ticketChannelId);
      if (!ch) return interaction.reply({ content: '❌ Canale ticket non trovato. Controlla l\'ID.', ephemeral: true });

      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const panelEmbed = new EmbedBuilder()
        .setTitle('🎫 Sistema di Supporto')
        .setDescription(
          '**Hai bisogno di aiuto?**\n\n' +
          '> Clicca il bottone qui sotto per aprire un ticket.\n' +
          '> Il nostro staff ti risponderà il prima possibile.\n\n' +
          '**Categorie disponibili:**\n' +
          '🛠️ Supporto Generale\n🐛 Segnalazione Bug\n❓ Domanda\n📋 Altro\n\n' +
          '⚠️ *Apri un ticket solo per motivi validi.*'
        )
        .setColor(0x5865f2)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('open_ticket_menu').setLabel('Apri un Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary)
      );

      await ch.send({ embeds: [panelEmbed], components: [row] });
      return interaction.reply({ content: `✅ Pannello ticket inviato in ${ch}!`, ephemeral: true });
    }

    if (customId === 'cfg_reset') {
      setConfig(guildId, {
        logChannelId: null, ticketChannelId: null, staffRoleId: null,
        ticketCategoryId: null, consigliRoleId: null, groqApiKey: null, setupDone: false,
      });
      return interaction.reply({ content: '🗑️ Configurazione di questo server resettata.', ephemeral: true });
    }
  },

  async handleConfigModal(interaction) {
    const { customId } = interaction;
    const guildId = interaction.guildId;

    if (customId === 'cfg_modal_channels') {
      const ticketChannelId = interaction.fields.getTextInputValue('ticket_channel_id').trim();
      const logChannelId = interaction.fields.getTextInputValue('log_channel_id').trim();
      setConfig(guildId, { ticketChannelId, logChannelId });
      return interaction.reply({ content: `✅ **Canali salvati!**\n📢 Ticket: <#${ticketChannelId}>\n📋 Log: <#${logChannelId}>`, ephemeral: true });
    }

    if (customId === 'cfg_modal_roles') {
      const staffRoleId = interaction.fields.getTextInputValue('staff_role_id').trim();
      const consigliRoleId = interaction.fields.getTextInputValue('consigli_role_id').trim() || null;
      setConfig(guildId, { staffRoleId, consigliRoleId, setupDone: true });
      return interaction.reply({
        content: `✅ **Ruoli salvati!**\n👥 Staff: <@&${staffRoleId}>\n🤖 /consiglio: ${consigliRoleId ? `<@&${consigliRoleId}>` : 'Usa ruolo staff'}`,
        ephemeral: true,
      });
    }

    if (customId === 'cfg_modal_category') {
      const ticketCategoryId = interaction.fields.getTextInputValue('category_id').trim();
      setConfig(guildId, { ticketCategoryId });
      return interaction.reply({ content: `✅ **Categoria salvata!** ID: \`${ticketCategoryId}\``, ephemeral: true });
    }

    if (customId === 'cfg_modal_groq') {
      const groqApiKey = interaction.fields.getTextInputValue('groq_key').trim();
      setConfig(guildId, { groqApiKey });
      return interaction.reply({ content: '✅ **Groq API Key salvata per questo server!**', ephemeral: true });
    }
  },
};
