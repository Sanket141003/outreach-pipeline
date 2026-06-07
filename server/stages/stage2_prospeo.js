import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const SENIORITY = ['C-Suite', 'VP', 'Founder/Owner', 'Director'];
const BASE = 'https://api.prospeo.io';

async function searchPeople(domain, env) {
  const MAX = parseInt(env.MAX_CONTACTS_PER_COMPANY || '2', 10);
  try {
    const res = await axios.post(
      `${BASE}/search-person`,
      {
        page: 1,
        filters: {
          company: { websites: { include: [domain] } },
          person_seniority: { include: SENIORITY },
        },
      },
      {
        headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (res.data.error) return [];
    return (res.data.results || []).slice(0, MAX);
  } catch {
    return [];
  }
}

async function enrichPerson(personId, env) {
  try {
    const res = await axios.post(
      `${BASE}/enrich-person`,
      { person_id: personId },
      {
        headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    if (res.data.error) return null;
    return res.data.person || null;
  } catch {
    return null;
  }
}

export async function findDecisionMakers(companies, env) {
  const prospects = [];
  const seen = new Set();

  for (const company of companies) {
    const results = await searchPeople(company.domain, env);

    for (const result of results) {
      const person = result.person;
      if (!person?.person_id || seen.has(person.person_id)) continue;
      seen.add(person.person_id);

      const enriched = await enrichPerson(person.person_id, env);
      await sleep(500);

      prospects.push({
        person_id: person.person_id,
        full_name: person.full_name || `${person.first_name} ${person.last_name}`.trim(),
        first_name: person.first_name || '',
        job_title: person.current_job_title || '',
        linkedin_url: enriched?.linkedin_url || person?.linkedin_url || null,
        company_name: result.company?.name || company.name,
        company_domain: company.domain,
      });
    }
    await sleep(300);
  }

  return prospects;
}
