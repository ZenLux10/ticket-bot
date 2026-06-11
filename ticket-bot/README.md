# 🎫 Ticket Bot v2.0 — Discord.js v14 + Groq AI

Bot professionale per la gestione dei ticket con integrazione AI (Groq) e configurazione completa da Discord.

---

## ✨ Funzionalità

| Funzione | Descrizione |
|---|---|
| 🎫 Apertura ticket | Menu a selezione con 4 categorie |
| 🔒 Chiusura con conferma | Bottone chiudi + conferma sicurezza |
| 📋 Trascrizione automatica | File .txt completo inviato via DM |
| ✋ Claim ticket | Lo staff può prendersi in carico un ticket |
| ➕➖ Gestione utenti | Aggiungi/rimuovi utenti dal ticket tramite modal |
| ⭐ Sistema feedback | Valutazione 1/3/5 stelle inviata via DM dopo chiusura |
| 🔓 Riapertura ticket | Lo staff può riaprire un ticket chiuso |
| 🗑️ Eliminazione ticket | Cancella il canale con timer 5 secondi |
| 🤖 `/consiglio` + Groq AI | Analisi AI del ticket → consiglio in DM allo staffer |
| ⚙️ `/configura` | Pannello unico per configurare tutto il bot |
| 📊 `/stats` | Statistiche ticket |
| 📝 `/nota` | Note interne staff |
| ✏️ `/rinomina` | Rinomina canale ticket |
| 📨 Log completi | Ogni azione loggata su canale dedicato |

---

## 🚀 Installazione

### 1. Requisiti
- Node.js **v18+** (fetch nativo incluso)
- Bot Discord da [Discord Developer Portal](https://discord.com/developers/applications)
- API Key Groq gratuita da [console.groq.com](https://console.groq.com)

### 2. Installa le dipendenze
```bash
cd ticket-bot
npm install
```

### 3. Configura il file `.env`
Copia `.env.example` in `.env` e compila **solo** i campi obbligatori:

```env
TOKEN=il_tuo_token_discord
CLIENT_ID=id_applicazione
GUILD_ID=id_server
```

> 💡 Tutto il resto (canali, ruoli, API Key Groq) puoi configurarlo direttamente su Discord con `/configura`!

### 4. Registra i comandi slash
```bash
node deploy-commands.js
```

### 5. Avvia il bot
```bash
npm start
```

### 6. Configura tutto da Discord
Scrivi `/configura` su Discord (richiede permesso Amministratore) e usa il pannello interattivo per impostare:
- 📢 Canale pannello ticket e canale log
- 👥 Ruolo staff e ruolo per `/consiglio`
- 📁 Categoria Discord per i ticket
- 🤖 Groq API Key
- 🎫 Invia il pannello ticket automaticamente

---

## ⚙️ Configurazione Discord

### Permessi bot necessari
- Read Messages / View Channels
- Send Messages, Send Messages in Threads
- Manage Channels
- Manage Messages
- Embed Links
- Attach Files
- Read Message History

### Intents (Developer Portal → Bot)
- ✅ SERVER MEMBERS INTENT
- ✅ MESSAGE CONTENT INTENT

---

## 📋 Comandi

| Comando | Descrizione | Permesso |
|---|---|---|
| `/configura` | Pannello completo di configurazione | Amministratore |
| `/consiglio` | Riceve via DM un consiglio AI sul ticket corrente | Ruolo configurabile |
| `/stats` | Statistiche ticket | Gestisci Server |
| `/nota [testo]` | Aggiunge nota interna al ticket | Gestisci Messaggi |
| `/rinomina [nome]` | Rinomina il canale del ticket | Gestisci Canali |

---

## 🤖 Groq AI — Come funziona `/consiglio`

1. Lo staffer esegue `/consiglio` dentro un ticket
2. Il bot legge gli ultimi 60 messaggi del ticket
3. Invia il testo a Groq AI (modello `llama3-8b-8192`)
4. L'AI analizza il problema e genera consigli pratici in italiano
5. Il consiglio arriva in **DM privato** allo staffer (non visibile all'utente)

**Ottieni la chiave Groq gratuita:** [console.groq.com](https://console.groq.com) → API Keys → Create API Key

---

## 📁 Struttura progetto

```
ticket-bot/
├── src/
│   ├── index.js
│   ├── commands/
│   │   ├── configura.js       ← Pannello configurazione completo
│   │   ├── consiglio.js       ← Consiglio AI via Groq
│   │   ├── setup.js
│   │   ├── stats.js
│   │   ├── nota.js
│   │   └── rinomina.js
│   ├── events/
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   ├── handlers/
│   │   └── ticketHandler.js
│   └── utils/
│       ├── config.js          ← Gestione configurazione persistente
│       ├── groq.js            ← Integrazione Groq AI
│       ├── transcript.js
│       └── logger.js
├── data/
│   ├── config.json            ← Creato automaticamente da /configura
│   └── transcripts/
├── deploy-commands.js
├── .env.example
├── package.json
└── README.md
```

---

## 🆘 Problemi comuni

| Problema | Soluzione |
|---|---|
| `Cannot find module 'dotenv'` | Esegui `npm install` |
| I comandi non appaiono | Esegui `node deploy-commands.js` e riavvia Discord |
| `/consiglio` dà errore API | Controlla la Groq API Key in `/configura` |
| Il bot non crea canali | Imposta la categoria in `/configura` e verifica i permessi |
| Non ricevo i DM | Abilita i DM dai membri del server in Impostazioni Privacy |
