const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function getTicketAdvice(ticketContent, category, apiKey) {
  if (!apiKey) throw new Error('Chiave API Groq non configurata. Usa /configura per impostarla.');

  const systemPrompt = `Sei un assistente esperto di supporto tecnico Discord. 
Il tuo compito è analizzare i messaggi di un ticket di supporto e fornire allo staff consigli pratici e concisi su come risolvere il problema.
Rispondi SEMPRE in italiano.
Sii diretto, professionale e utile. Fornisci:
1. Una breve analisi del problema
2. Passi concreti per risolverlo
3. Eventuali domande da fare all'utente per chiarire
Massimo 300 parole.`;

  const userPrompt = `Categoria ticket: ${category}\n\nMessaggi del ticket:\n${ticketContent}\n\nFornisci consigli pratici per risolvere questo ticket.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Errore Groq API (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Nessuna risposta dall\'AI.';
}

async function extractTicketMessages(channel, limit = 50) {
  const messages = await channel.messages.fetch({ limit }).catch(() => null);
  if (!messages) return 'Nessun messaggio disponibile.';

  const lines = [];
  for (const msg of [...messages.values()].reverse()) {
    if (msg.author.bot) continue;
    const time = new Date(msg.createdTimestamp).toLocaleTimeString('it-IT');
    lines.push(`[${time}] ${msg.author.username}: ${msg.content || '[allegato/embed]'}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'Nessun messaggio degli utenti trovato.';
}

module.exports = { getTicketAdvice, extractTicketMessages };
