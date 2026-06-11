const {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { generateTranscript } = require('../utils/transcript');
const { sendLog } = require('../utils/logger');
const { getConfig } = require('../utils/config');

const CATEGORIES = {
  support: { label: '🛠️ Supporto Generale', emoji: '🛠️', color: 0x5865f2 },
  bug: { label: '🐛 Segnalazione Bug', emoji: '🐛', color: 0xed4245 },
  question: { label: '❓ Domanda', emoji: '❓', color: 0xfee75c },
  other: { label: '📋 Altro', emoji: '📋', color: 0x57f287 },
};

module.exports = {
  // Gestione bottoni
  async handleButton(interaction, client) {
    const { customId } = interaction;

    if (customId === 'open_ticket_menu') return this.showCategoryMenu(interaction);
    if (customId.startsWith('close_ticket')) return this.closeTicket(interaction, client);
    if (customId.startsWith('confirm_close')) return this.confirmClose(interaction, client);
    if (customId.startsWith('cancel_close')) return this.cancelClose(interaction);
    if (customId.startsWith('claim_ticket')) return this.claimTicket(interaction, client);
    if (customId.startsWith('add_user')) return this.showAddUserModal(interaction);
    if (customId.startsWith('remove_user')) return this.showRemoveUserModal(interaction);
    if (customId.startsWith('delete_ticket')) return this.deleteTicket(interaction, client);
    if (customId.startsWith('feedback_')) return this.handleFeedback(interaction, client);
    if (customId.startsWith('reopen_ticket')) return this.reopenTicket(interaction, client);
  },

  // Gestione select menu
  async handleSelect(interaction, client) {
    if (interaction.customId === 'ticket_category') {
      await this.createTicket(interaction, client);
    }
  },

  // Gestione modali
  async handleModal(interaction, client) {
    if (interaction.customId === 'add_user_modal') return this.addUser(interaction);
    if (interaction.customId === 'remove_user_modal') return this.removeUser(interaction);
  },

  // Mostra menu selezione categoria
  async showCategoryMenu(interaction) {
    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Seleziona una categoria...')
      .addOptions(
        Object.entries(CATEGORIES).map(([value, cat]) => ({
          label: cat.label,
          value,
          emoji: cat.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({
      content: '📂 **Seleziona la categoria del tuo ticket:**',
      components: [row],
      ephemeral: true,
    });
  },

  // Crea il ticket
  async createTicket(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const user = interaction.user;
    const categoryKey = interaction.values[0];
    const cat = CATEGORIES[categoryKey];

    const cfg = getConfig(interaction.guildId);
    const staffRoleId = cfg.staffRoleId || process.env.STAFF_ROLE_ID;
    const ticketCategoryId = cfg.ticketCategoryId || process.env.TICKET_CATEGORY_ID;

    // Controlla ticket esistente
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` && c.parentId === ticketCategoryId
    );
    if (existing) {
      return interaction.editReply({ content: `❌ Hai già un ticket aperto: ${existing}` });
    }

    // Crea il canale
    const permOverwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
    ];
    if (staffRoleId) {
      permOverwrites.push({ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
    }

    const channel = await guild.channels.create({
      name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`,
      type: ChannelType.GuildText,
      parent: ticketCategoryId || null,
      permissionOverwrites: permOverwrites,
    });

    // Salva dati ticket
    client.ticketData.set(channel.id, {
      ownerId: user.id,
      category: categoryKey,
      claimedBy: null,
      createdAt: Date.now(),
      status: 'open',
    });

    // Embed principale
    const embed = new EmbedBuilder()
      .setTitle(`${cat.emoji} Ticket — ${cat.label}`)
      .setDescription(
        `Benvenuto ${user}!\n\n` +
        `> Descrivi il tuo problema nel modo più dettagliato possibile.\n` +
        `> Il nostro staff ti risponderà il prima possibile.\n\n` +
        `📌 **Categoria:** ${cat.label}\n` +
        `🕐 **Aperto:** <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setColor(cat.color)
      .setFooter({ text: `ID: ${channel.id}` })
      .setThumbnail(user.displayAvatarURL());

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_ticket_${channel.id}`).setLabel('Prendi in carico').setEmoji('✋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`add_user_${channel.id}`).setLabel('Aggiungi utente').setEmoji('➕').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`remove_user_${channel.id}`).setLabel('Rimuovi utente').setEmoji('➖').setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`close_ticket_${channel.id}`).setLabel('Chiudi Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    );

    await channel.send({ content: `${user}${staffRoleId ? ` | <@&${staffRoleId}>` : ''}`, embeds: [embed], components: [row1, row2] });

    await sendLog(client, guild, {
      title: '🎫 Nuovo Ticket Aperto',
      description: `**Utente:** ${user}\n**Canale:** ${channel}\n**Categoria:** ${cat.label}`,
      color: 0x57f287,
      channelId: cfg.logChannelId,
    });

    await interaction.editReply({ content: `✅ Ticket creato: ${channel}` });
  },

  // Claim ticket
  async claimTicket(interaction, client) {
    const cfg = getConfig(interaction.guildId);
    const staffRoleId = cfg.staffRoleId || process.env.STAFF_ROLE_ID;
    if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: '❌ Solo lo staff può prendere in carico i ticket.', ephemeral: true });
    }

    const channelId = interaction.customId.replace('claim_ticket_', '');
    const data = client.ticketData.get(channelId);
    if (!data) return interaction.reply({ content: '❌ Dati ticket non trovati.', ephemeral: true });
    if (data.claimedBy) return interaction.reply({ content: `❌ Questo ticket è già in carico a <@${data.claimedBy}>.`, ephemeral: true });

    data.claimedBy = interaction.user.id;
    client.ticketData.set(channelId, data);

    const embed = new EmbedBuilder()
      .setDescription(`✋ **${interaction.user}** ha preso in carico questo ticket.`)
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });

    const cfgClaim = getConfig(interaction.guildId);
    await sendLog(client, interaction.guild, {
      title: '✋ Ticket Preso in Carico',
      description: `**Staff:** ${interaction.user}\n**Canale:** ${interaction.channel}`,
      color: 0x5865f2,
      channelId: cfgClaim.logChannelId,
    });
  },

  // Mostra modal aggiungi utente
  async showAddUserModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('add_user_modal')
      .setTitle('Aggiungi Utente al Ticket');
    const input = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID o @menzione dell\'utente')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  },

  // Aggiungi utente
  async addUser(interaction) {
    const raw = interaction.fields.getTextInputValue('user_id').replace(/[<@!>]/g, '');
    const member = await interaction.guild.members.fetch(raw).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Utente non trovato.', ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    await interaction.reply({ content: `✅ ${member} aggiunto al ticket.` });
  },

  // Mostra modal rimuovi utente
  async showRemoveUserModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('remove_user_modal')
      .setTitle('Rimuovi Utente dal Ticket');
    const input = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID o @menzione dell\'utente')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678')
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  },

  // Rimuovi utente
  async removeUser(interaction) {
    const raw = interaction.fields.getTextInputValue('user_id').replace(/[<@!>]/g, '');
    const member = await interaction.guild.members.fetch(raw).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Utente non trovato.', ephemeral: true });

    const data = client.ticketData.get(interaction.channel.id);
    if (data && data.ownerId === member.id) {
      return interaction.reply({ content: '❌ Non puoi rimuovere il proprietario del ticket.', ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(member.id, { ViewChannel: false });
    await interaction.reply({ content: `✅ ${member} rimosso dal ticket.` });
  },

  // Chiudi ticket — chiedi conferma
  async closeTicket(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Conferma Chiusura')
      .setDescription('Sei sicuro di voler chiudere questo ticket?\nVerrà generata una trascrizione.')
      .setColor(0xfee75c);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`confirm_close_${interaction.channel.id}`).setLabel('Conferma').setEmoji('✅').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`cancel_close_${interaction.channel.id}`).setLabel('Annulla').setEmoji('❌').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  // Annulla chiusura
  async cancelClose(interaction) {
    await interaction.update({ content: '❌ Chiusura annullata.', embeds: [], components: [] });
  },

  // Conferma chiusura
  async confirmClose(interaction, client) {
    await interaction.deferUpdate();
    const channel = interaction.channel;
    const data = client.ticketData.get(channel.id);
    if (!data) return;

    data.status = 'closed';
    client.ticketData.set(channel.id, data);

    // Genera trascrizione
    const transcriptPath = await generateTranscript(channel);

    // Rimuovi permesso di scrivere all'owner
    if (data.ownerId) {
      await channel.permissionOverwrites.edit(data.ownerId, { SendMessages: false }).catch(() => {});
    }

    const cat = CATEGORIES[data.category] || CATEGORIES.other;
    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Ticket Chiuso')
      .setDescription(
        `**Chiuso da:** ${interaction.user}\n` +
        `**Categoria:** ${cat.label}\n` +
        `**Durata:** ${formatDuration(Date.now() - data.createdAt)}`
      )
      .setColor(0xed4245)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`delete_ticket_${channel.id}`).setLabel('Elimina Ticket').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`reopen_ticket_${channel.id}`).setLabel('Riapri Ticket').setEmoji('🔓').setStyle(ButtonStyle.Success),
    );

    await channel.send({ embeds: [closeEmbed], components: [row] });

    // Invia trascrizione al proprietario
    if (data.ownerId) {
      const owner = await client.users.fetch(data.ownerId).catch(() => null);
      if (owner) {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🎫 Il tuo ticket è stato chiuso')
          .setDescription(`Il tuo ticket nel server **${interaction.guild.name}** è stato chiuso.\nIn allegato trovi la trascrizione.`)
          .setColor(0x5865f2)
          .setTimestamp();

        const feedbackRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`feedback_5_${channel.id}`).setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`feedback_3_${channel.id}`).setLabel('⭐⭐⭐').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`feedback_1_${channel.id}`).setLabel('⭐').setStyle(ButtonStyle.Danger),
        );

        await owner.send({
          embeds: [dmEmbed],
          files: [transcriptPath],
          components: [feedbackRow],
        }).catch(() => {});
      }
    }

    // Log
    const cfgClose = getConfig(interaction.guildId);
    await sendLog(client, interaction.guild, {
      title: '🔒 Ticket Chiuso',
      description: `**Chiuso da:** ${interaction.user}\n**Canale:** #${channel.name}\n**Categoria:** ${cat.label}\n**Durata:** ${formatDuration(Date.now() - data.createdAt)}`,
      color: 0xed4245,
      file: transcriptPath,
      channelId: cfgClose.logChannelId,
    });
  },

  // Riapri ticket
  async reopenTicket(interaction, client) {
    const cfg = getConfig(interaction.guildId);
    const staffRoleId = cfg.staffRoleId || process.env.STAFF_ROLE_ID;
    if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: '❌ Solo lo staff può riaprire i ticket.', ephemeral: true });
    }

    const data = client.ticketData.get(interaction.channel.id);
    if (!data) return interaction.reply({ content: '❌ Dati ticket non trovati.', ephemeral: true });

    data.status = 'open';
    client.ticketData.set(interaction.channel.id, data);

    if (data.ownerId) {
      await interaction.channel.permissionOverwrites.edit(data.ownerId, { SendMessages: true }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setDescription(`🔓 **${interaction.user}** ha riaperto questo ticket.`)
      .setColor(0x57f287);

    await interaction.update({ components: [] });
    await interaction.channel.send({ embeds: [embed] });
  },

  // Elimina ticket
  async deleteTicket(interaction, client) {
    const cfg = getConfig(interaction.guildId);
    const staffRoleId = cfg.staffRoleId || process.env.STAFF_ROLE_ID;
    if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: '❌ Solo lo staff può eliminare i ticket.', ephemeral: true });
    }

    await interaction.reply({ content: '🗑️ Eliminazione del canale tra 5 secondi...' });

    const data = client.ticketData.get(interaction.channel.id);
    const cfgDel = getConfig(interaction.guildId);
    await sendLog(client, interaction.guild, {
      title: '🗑️ Ticket Eliminato',
      description: `**Eliminato da:** ${interaction.user}\n**Canale:** #${interaction.channel.name}`,
      color: 0xed4245,
      channelId: cfgDel.logChannelId,
    });

    setTimeout(async () => {
      client.ticketData.delete(interaction.channel.id);
      await interaction.channel.delete().catch(() => {});
    }, 5000);
  },

  // Feedback
  async handleFeedback(interaction, client) {
    const parts = interaction.customId.split('_');
    const stars = parseInt(parts[1]);
    const channelId = parts[2];

    const labels = { 5: '⭐⭐⭐⭐⭐ Eccellente', 3: '⭐⭐⭐ Nella media', 1: '⭐ Da migliorare' };

    const embed = new EmbedBuilder()
      .setTitle('💬 Feedback Ricevuto')
      .setDescription(`**Valutazione:** ${labels[stars] || `${stars} stelle`}\n**Utente:** ${interaction.user}`)
      .setColor(stars >= 4 ? 0x57f287 : stars >= 3 ? 0xfee75c : 0xed4245)
      .setTimestamp();

    const cfg2 = getConfig(interaction.guildId);
    await sendLog(client, null, { embed, directEmbed: true, client, channelId: cfg2.logChannelId || process.env.LOG_CHANNEL_ID });
    await interaction.update({ content: '✅ Grazie per il tuo feedback!', embeds: [], components: [] });
  },
};

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}g ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
