import axios from 'axios';

/**
 * Stage 1 — Ocean.io Lookalike Companies Search
 * Endpoint: POST https://api.ocean.io/v3/search/companies
 * Auth header: x-api-token (NOT x-api-key)
 * Docs: api.ocean.io → Search → Lookalike companies search
 */
export async function findLookalikeCompanies(seedDomain, env) {
  const MAX = parseInt(env.MAX_LOOKALIKES || '5', 10);

  const response = await axios.post(
    'https://api.ocean.io/v3/search/companies',
    {
      size: MAX,
      companiesFilters: {
        lookalikeDomains: [seedDomain],
      },
    },
    {
      headers: {
        'x-api-token': env.OCEAN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const companies = response.data?.companies || [];

  if (companies.length === 0) {
    console.log('Ocean.io returned 0 companies');
    return [];
  }

  return companies
    .filter(c => c.domain && c.name)
    .slice(0, MAX)
    .map(c => ({
      domain: c.domain.toLowerCase().trim(),
      name: c.name,
      score: c.score || 0,
    }));
}
