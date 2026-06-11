const { EmbedBuilder } = require('discord.js');

async function sendLog(client, guild, { title, description, color, file, embed, directEmbed, channelId }) {
  try {
    const logChannelId = channelId || process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return;

    const logChannel = client.channels.cache.get(logChannelId)
      || await client.channels.fetch(logChannelId).catch(() => null);

    if (!logChannel) return;

    if (directEmbed && embed) {
      await logChannel.send({ embeds: [embed] });
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setTitle(title || 'Log')
      .setDescription(description || '')
      .setColor(color || 0x5865f2)
      .setTimestamp();

    const payload = { embeds: [logEmbed] };
    if (file) payload.files = [file];

    await logChannel.send(payload);
  } catch (err) {
    console.error('Errore invio log:', err.message);
  }
}

module.exports = { sendLog };
