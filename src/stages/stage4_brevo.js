/**
 * Stage 4 — Brevo (Sendinblue)
 * Sends a personalized outreach email to each contact.
 *
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 * Auth: api-key header
 * Docs: https://developers.brevo.com/reference/send-transac-email
 */
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/sleep.js';
import { buildEmailBody } from '../email/template.js';

const BASE_URL = 'https://api.brevo.com/v3';

async function sendEmail(contact, seedDomain) {
  const { subject, htmlContent, textContent } = buildEmailBody(contact, seedDomain);

  const payload = {
    sender: {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL,
    },
    to: [{ email: contact.email, name: contact.full_name }],
    subject,
    htmlContent,
    textContent,
    // tag for tracking in Brevo dashboard
    tags: ['outreach-pipeline'],
  };

  try {
    const res = await axios.post(`${BASE_URL}/smtp/email`, payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    logger.info(`Email queued: ${contact.email} (messageId: ${res.data.messageId})`);
    return { email: contact.email, success: true, messageId: res.data.messageId };
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message;
    logger.warn(`Failed to send to ${contact.email}: ${errMsg}`);
    return { email: contact.email, success: false, error: errMsg };
  }
}

export async function sendOutreachEmails(contacts, seedDomain) {
  const results = [];

  for (const contact of contacts) {
    const result = await sendEmail(contact, seedDomain);
    results.push(result);
    await sleep(300); // stay within Brevo rate limits
  }

  return results;
}
