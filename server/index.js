import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { findLookalikeCompanies } from './stages/stage1_ocean.js';
import { findDecisionMakers } from './stages/stage2_prospeo.js';
import { resolveEmails } from './stages/stage3_prospeo_enrich.js';
import { sendOutreachEmails } from './stages/stage4_brevo.js';

const app = express();
app.use(express.json());

// Allow all origins — frontend can be on any Vercel subdomain
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

// Health check — Render pings this to keep the service alive
app.get('/', (req, res) => res.json({ status: 'ok', service: 'outreach-pipeline-api' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

/**
 * POST /api/run
 * Body: { domain, ocean, prospeo, brevo, senderEmail, senderName, dryRun }
 * Streams progress via SSE (Server-Sent Events)
 * Uses POST so API keys never appear in server access logs
 */
app.post('/api/run', async (req, res) => {
  const { domain, dryRun } = req.body;

  if (!domain) return res.status(400).json({ error: 'domain is required' });

  // API keys come from server environment variables — never from the client
  const ocean = process.env.OCEAN_API_KEY;
  const prospeo = process.env.PROSPEO_API_KEY;
  const brevo = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME;

  if (!ocean || !prospeo || !brevo || !senderEmail || !senderName) {
    return res.status(500).json({ error: 'Server is missing API key configuration. Contact the administrator.' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering on Render
  res.flushHeaders();

  const send = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  // Keep-alive ping every 20s so Render/proxies don't close the stream
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  const env = {
    OCEAN_API_KEY: ocean,
    PROSPEO_API_KEY: prospeo,
    BREVO_API_KEY: brevo,
    SENDER_EMAIL: senderEmail,
    SENDER_NAME: senderName,
    MAX_LOOKALIKES: process.env.MAX_LOOKALIKES || '5',
    MAX_CONTACTS_PER_COMPANY: process.env.MAX_CONTACTS_PER_COMPANY || '2',
  };

  try {
    // Stage 1
    send('stage', { stage: 1, message: `Finding lookalike companies for ${domain}...` });
    const companies = await findLookalikeCompanies(domain, env);
    send('stage1_done', { companies });

    if (companies.length === 0) {
      send('error', { message: 'No lookalike companies found.' });
      return res.end();
    }

    // Stage 2
    send('stage', { stage: 2, message: 'Finding decision-makers...' });
    const prospects = await findDecisionMakers(companies, env);
    send('stage2_done', { prospects });

    if (prospects.length === 0) {
      send('error', { message: 'No decision-makers found.' });
      return res.end();
    }

    // Stage 3
    send('stage', { stage: 3, message: 'Resolving work emails...' });
    const contacts = await resolveEmails(prospects, env);
    send('stage3_done', { contacts });

    if (contacts.length === 0) {
      send('error', { message: 'No emails could be resolved.' });
      return res.end();
    }

    // Stage 4 — skip actual send if dryRun
    if (dryRun === 'true') {
      send('dry_run', { contacts, message: 'Dry run — no emails sent.' });
    } else {
      send('stage', { stage: 4, message: `Sending ${contacts.length} outreach emails...` });
      const results = await sendOutreachEmails(contacts, domain, env);
      send('stage4_done', { results });
    }

    send('done', { message: 'Pipeline complete!' });
  } catch (err) {
    const detail = err.response
      ? `HTTP ${err.response.status} — ${JSON.stringify(err.response.data)}`
      : err.message;
    send('error', { message: detail });
  } finally {
    clearInterval(keepAlive);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
