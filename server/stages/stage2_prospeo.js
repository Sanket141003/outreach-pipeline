import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));
// 'VP' is not valid on all Prospeo plans — use only confirmed valid values
const SENIORITY = ['C-Suite', 'Founder/Owner', 'Director'];
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

    console.log(`Prospeo ${domain}:`, res.data.error ? res.data.error_code : `${res.data.results?.length || 0} results`);

    if (res.data.error) {
      // If still invalid filters, try without seniority filter
      if (res.data.error_code === 'INVALID_FILTERS') {
        const res2 = await axios.post(
          `${BASE}/search-person`,
          {
            page: 1,
            filters: {
              company: { websites: { include: [domain] } },
            },
          },
          {
            headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );
        if (!res2.data.error) return (res2.data.results || []).slice(0, MAX);
      }
      return [];
    }

    return (res.data.results || []).slice(0, MAX);
  } catch (err) {
    console.log(`Prospeo search error for ${domain}:`, err.response?.data || err.message);
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
    console.log(`Searching decision-makers at: ${company.domain}`);
    const results = await searchPeople(company.domain, env);

    for (const result of results) {
      const person = result.person;
      if (!person?.person_id || seen.has(person.person_id)) continue;
      seen.add(person.person_id);

      const enriched = await enrichPerson(person.person_id, env);
      await sleep(800);

      // email and linkedin_url are already in the search-person response
      const email = person?.email?.email || enriched?.email?.email || null;
      const linkedin_url = person?.linkedin_url || enriched?.linkedin_url || null;

      console.log(`${person.full_name} — email: ${email}, linkedin: ${linkedin_url}`);

      prospects.push({
        person_id: person.person_id,
        full_name: person.full_name || `${person.first_name} ${person.last_name}`.trim(),
        first_name: person.first_name || '',
        job_title: person.current_job_title || '',
        linkedin_url,
        email,
        company_name: result.company?.name || company.name,
        company_domain: company.domain,
      });
    }
    await sleep(1500); // avoid rate limit between companies
  }

  console.log(`Total prospects found: ${prospects.length}`);
  return prospects;
}
