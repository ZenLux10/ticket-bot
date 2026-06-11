const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../data/config.json');

const DEFAULT_CONFIG = {
  logChannelId: null,
  ticketChannelId: null,
  staffRoleId: null,
  ticketCategoryId: null,
  consigliRoleId: null,
  groqApiKey: null,
  setupDone: false,
};

function loadAll() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveAll(data) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Ottieni config di uno specifico server
function getConfig(guildId) {
  const all = loadAll();
  return { ...DEFAULT_CONFIG, ...(all[guildId] || {}) };
}

// Aggiorna config di uno specifico server
function setConfig(guildId, partial) {
  const all = loadAll();
  all[guildId] = { ...(all[guildId] || DEFAULT_CONFIG), ...partial };
  saveAll(all);
  return all[guildId];
}

module.exports = { getConfig, setConfig };
