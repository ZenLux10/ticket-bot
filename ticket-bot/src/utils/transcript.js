const fs = require('fs');
const path = require('path');

async function generateTranscript(channel) {
  const transcriptsDir = path.join(__dirname, '../../data/transcripts');
  if (!fs.existsSync(transcriptsDir)) fs.mkdirSync(transcriptsDir, { recursive: true });

  const messages = await fetchAllMessages(channel);
  messages.reverse();

  const lines = [
    `╔══════════════════════════════════════════╗`,
    `║         TRASCRIZIONE TICKET              ║`,
    `╚══════════════════════════════════════════╝`,
    ``,
    `📌 Canale  : #${channel.name}`,
    `🆔 ID      : ${channel.id}`,
    `📅 Data    : ${new Date().toLocaleString('it-IT')}`,
    `📨 Messaggi: ${messages.length}`,
    ``,
    `──────────────────────────────────────────────`,
    ``,
  ];

  for (const msg of messages) {
    const timestamp = new Date(msg.createdTimestamp).toLocaleString('it-IT');
    const author = `${msg.author.username}#${msg.author.discriminator}` || msg.author.username;
    const isBot = msg.author.bot ? ' [BOT]' : '';

    lines.push(`[${timestamp}] ${author}${isBot}`);

    if (msg.content) {
      lines.push(`  ${msg.content}`);
    }

    if (msg.embeds.length > 0) {
      for (const embed of msg.embeds) {
        if (embed.title) lines.push(`  [EMBED] ${embed.title}`);
        if (embed.description) lines.push(`    ${embed.description.slice(0, 200)}`);
      }
    }

    if (msg.attachments.size > 0) {
      for (const att of msg.attachments.values()) {
        lines.push(`  [ALLEGATO] ${att.url}`);
      }
    }

    lines.push('');
  }

  lines.push(`──────────────────────────────────────────────`);
  lines.push(`Fine trascrizione — ${new Date().toLocaleString('it-IT')}`);

  const filename = `transcript-${channel.id}-${Date.now()}.txt`;
  const filePath = path.join(transcriptsDir, filename);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

  return filePath;
}

async function fetchAllMessages(channel) {
  const messages = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    messages.push(...batch.values());
    lastId = batch.last().id;

    if (batch.size < 100) break;
  }

  return messages;
}

module.exports = { generateTranscript };
