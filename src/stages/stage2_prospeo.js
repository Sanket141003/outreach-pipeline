/**
 * Stage 2 — Prospeo
 * Takes company domains and returns C-suite/VP decision-makers with LinkedIn URLs.
 *
 * Uses two endpoints:
 *   1. POST https://api.prospeo.io/search-person  → find people (no email in response)
 *   2. POST https://api.prospeo.io/enrich-person  → get LinkedIn URL per person_id
 *
 * Auth: X-KEY header
 * Docs: https://prospeo.io/api-docs/search-person
 */
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/sleep.js';

const MAX_PER_COMPANY = parseInt(process.env.MAX_CONTACTS_PER_COMPANY || '2', 10);
const BASE_URL = 'https://api.prospeo.io';

const SENIORITY_LEVELS = ['C-Suite', 'VP', 'Founder/Owner', 'Director'];

async function searchPeopleAtDomain(domain) {
  const payload = {
    page: 1,
    filters: {
      company: {
        websites: { include: [domain] },
      },
      person_seniority: {
        include: SENIORITY_LEVELS,
      },
    },
  };

  try {
    const res = await axios.post(`${BASE_URL}/search-person`, payload, {
      headers: {
        'X-KEY': process.env.PROSPEO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    if (res.data.error) {
      logger.warn(`Prospeo search error for ${domain}: ${res.data.error_code}`);
      return [];
    }

    return (res.data.results || []).slice(0, MAX_PER_COMPANY);
  } catch (err) {
    logger.warn(`Prospeo search failed for ${domain}: ${err.message}`);
    return [];
  }
}

async function enrichPerson(personId) {
  try {
    const res = await axios.post(
      `${BASE_URL}/enrich-person`,
      { person_id: personId },
      {
        headers: {
          'X-KEY': process.env.PROSPEO_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (res.data.error) return null;
    return res.data.person || null;
  } catch {
    return null;
  }
}

export async function findDecisionMakers(companies) {
  const allProspects = [];

  for (const company of companies) {
    logger.info(`Searching decision-makers at ${company.domain}...`);
    const results = await searchPeopleAtDomain(company.domain);

    for (const result of results) {
      const person = result.person;
      if (!person?.person_id) continue;

      // Enrich to get linkedin_url
      const enriched = await enrichPerson(person.person_id);
      await sleep(500); // be polite to the API

      const linkedinUrl = enriched?.linkedin_url || person?.linkedin_url || null;

      allProspects.push({
        person_id: person.person_id,
        full_name: person.full_name || `${person.first_name} ${person.last_name}`.trim(),
        first_name: person.first_name || '',
        job_title: person.current_job_title || '',
        linkedin_url: linkedinUrl,
        company_name: result.company?.name || company.name,
        company_domain: company.domain,
      });
    }

    await sleep(300);
  }

  // Deduplicate by person_id
  const seen = new Set();
  return allProspects.filter(p => {
    if (seen.has(p.person_id)) return false;
    seen.add(p.person_id);
    return true;
  });
}
