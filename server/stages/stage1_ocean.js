import axios from 'axios';

/**
 * Ocean.io API
 * POST https://api.ocean.io/v2/companies/search
 * Auth: x-api-key header
 * Uses lookalikeDomains filter inside companiesFiltersJson
 */
export async function findLookalikeCompanies(seedDomain, env) {
  const MAX = parseInt(env.MAX_LOOKALIKES || '5', 10);

  const payload = {
    size: MAX,
    companiesFiltersJson: JSON.stringify({
      lookalikeDomains: [seedDomain],
    }),
  };

  const response = await axios.post(
    'https://api.ocean.io/v2/companies/search',
    payload,
    {
      headers: {
        'x-api-key': env.OCEAN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const companies = response.data?.companies || [];

  return companies
    .filter(c => c.domain && c.name)
    .slice(0, MAX)
    .map(c => ({
      domain: c.domain.toLowerCase().trim(),
      name: c.name,
      score: c.matchRelevance || 0,
    }));
}
