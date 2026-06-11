import axios from 'axios';

/**
 * Stage 1 — Company lookalike search
 *
 * Strategy: Try Ocean.io first. If it fails (wrong endpoint / no access),
 * fall back to Prospeo /search-company using the seed domain's industry
 * to find similar companies.
 *
 * Ocean.io endpoint (varies by account plan):
 *   POST https://api.ocean.io/v1/similar   { domain, limit }
 *   POST https://api.ocean.io/v2/lookalike  { domains: [domain], size }
 *   POST https://api.ocean.io/companies     { lookalike: domain, size }
 *
 * We try all known variants, then fall back to Prospeo.
 */

const sleep = ms => new Promise(r => setTimeout(r, ms));

const OCEAN_ENDPOINTS = [
  {
    url: 'https://api.ocean.io/v1/similar',
    body: (domain, max) => ({ domain, limit: max }),
    extract: data => data?.results || [],
  },
  {
    url: 'https://api.ocean.io/v2/lookalike',
    body: (domain, max) => ({ domains: [domain], size: max }),
    extract: data => data?.results || data?.companies || [],
  },
  {
    url: 'https://api.ocean.io/companies',
    body: (domain, max) => ({ lookalike: domain, size: max }),
    extract: data => data?.results || data?.companies || [],
  },
  {
    url: 'https://api.ocean.io/v2/search',
    body: (domain, max) => ({ lookalike: domain, size: max }),
    extract: data => data?.results || [],
  },
]

async function tryOcean(seedDomain, env, MAX) {
  for (const ep of OCEAN_ENDPOINTS) {
    try {
      const res = await axios.post(ep.url, ep.body(seedDomain, MAX), {
        headers: {
          'x-api-key': env.OCEAN_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });
      const items = ep.extract(res.data);
      if (items.length > 0) {
        console.log(`Ocean.io success with endpoint: ${ep.url}`);
        return items
          .filter(c => c.domain && c.name)
          .slice(0, MAX)
          .map(c => ({ domain: c.domain.toLowerCase().trim(), name: c.name, score: c.score || 0 }));
      }
    } catch (err) {
      const status = err.response?.status;
      console.log(`Ocean.io ${ep.url} → ${status || err.message}`);
      // keep trying other endpoints
    }
    await sleep(300);
  }
  return null; // all endpoints failed
}

async function fallbackProspeo(seedDomain, env, MAX) {
  console.log('Ocean.io unavailable — using Prospeo company search as fallback');

  // First enrich the seed company to get its industry
  let industry = null;
  try {
    const enrichRes = await axios.post(
      'https://api.prospeo.io/enrich-company',
      { domain: seedDomain },
      {
        headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
        timeout: 12000,
      }
    );
    industry = enrichRes.data?.company?.industry || null;
    console.log(`Seed company industry: ${industry}`);
  } catch {
    console.log('Could not enrich seed company, using keyword fallback');
  }

  // Search for similar companies using industry or seed domain keyword
  const filters = industry
    ? { company_industry: { include: [industry] } }
    : { company_keywords: { keywords: [seedDomain.split('.')[0]], source: ['all'] } };

  try {
    const res = await axios.post(
      'https://api.prospeo.io/search-company',
      { page: 1, filters },
      {
        headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    if (res.data.error) throw new Error(res.data.error_code);

    const results = res.data.results || [];
    return results
      .filter(c => c.company?.domain && c.company?.name && c.company.domain !== seedDomain)
      .slice(0, MAX)
      .map(c => ({
        domain: c.company.domain.toLowerCase().trim(),
        name: c.company.name,
        score: 1,
      }));
  } catch (err) {
    throw new Error(`Both Ocean.io and Prospeo fallback failed: ${err.message}`);
  }
}

export async function findLookalikeCompanies(seedDomain, env) {
  const MAX = parseInt(env.MAX_LOOKALIKES || '5', 10);

  // Try Ocean.io with all known endpoint variants
  const oceanResult = await tryOcean(seedDomain, env, MAX);
  if (oceanResult !== null) return oceanResult;

  // Fall back to Prospeo company search
  return fallbackProspeo(seedDomain, env, MAX);
}
