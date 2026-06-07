/**
 * Stage 3 — Prospeo Social URL Enrichment (replaces Eazyreach)
 * Takes LinkedIn URLs and resolves them to verified work emails via Prospeo.
 *
 * Endpoint: POST https://api.prospeo.io/enrich-person
 * Auth: X-KEY header
 * Docs: https://prospeo.io/api-docs/enrich-person
 *
 * Request body: { linkedin_url: "https://linkedin.com/in/..." }
 * Response includes person.email.email when verified.
 *
 * Note: Vocallabs confirmed Eazyreach credits unavailable — use Prospeo directly.
 */
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/sleep.js';

const BASE_URL = 'https://api.prospeo.io';

async function resolveEmail(prospect) {
  if (!prospect.linkedin_url) {
    logger.warn(`No LinkedIn URL for ${prospect.full_name} — skipping`);
    return null;
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/enrich-person`,
      { linkedin_url: prospect.linkedin_url },
      {
        headers: {
          'X-KEY': process.env.PROSPEO_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const data = res.data;
    if (data.error) {
      logger.warn(`Prospeo enrich error for ${prospect.full_name}: ${data.error_code}`);
      return null;
    }

    const email = data.person?.email?.email;
    if (!email) {
      logger.warn(`No email resolved for ${prospect.full_name}`);
      return null;
    }

    return {
      ...prospect,
      email,
      first_name: data.person?.first_name || prospect.first_name,
      full_name: data.person?.full_name || prospect.full_name,
    };
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 422) {
      logger.warn(`Prospeo: no match for ${prospect.full_name}`);
      return null;
    }
    logger.warn(`Prospeo enrich error for ${prospect.full_name}: ${err.message}`);
    return null;
  }
}

export async function resolveEmails(prospects) {
  const contacts = [];

  for (const prospect of prospects) {
    const contact = await resolveEmail(prospect);
    if (contact) contacts.push(contact);
    await sleep(600); // rate limit buffer
  }

  return contacts;
}
