import axios from 'axios';

/**
 * Stage 1 — Ocean.io Lookalike Companies Search
 * Endpoint: POST https://api.ocean.io/v3/search/companies
 * Auth header: x-api-token
 *
 * Request body:
 * {
 *   "size": 5,
 *   "companiesFilters": {
 *     "lookalikeDomains": ["stripe.com"]
 *   }
 * }
 *
 * Response fields vary — could be results[], companies[], or data[]
 */
export async function findLookalikeCompanies(seedDomain, env) {
  const MAX = parseInt(env.MAX_LOOKALIKES || '5', 10);

  let response;
  try {
    response = await axios.post(
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
  } catch (err) {
    const status = err.response?.status;
    const body = JSON.stringify(err.response?.data);
    throw new Error(`Ocean.io error: ${status} — ${body || err.message}`);
  }

  // Log the raw response keys so we can see exact shape
  const data = response.data;
  console.log('Ocean.io raw response keys:', Object.keys(data || {}));
  console.log('Ocean.io total:', data?.total);

  // Try all possible response array fields
  const items = data?.results || data?.companies || data?.data || data?.items || [];

  console.log(`Ocean.io items found: ${items.length}`);

  if (items.length === 0) {
    // Log the full response to debug
    console.log('Ocean.io full response:', JSON.stringify(data).slice(0, 500));
    return [];
  }

  // Log first item to see field names
  console.log('Ocean.io first item keys:', Object.keys(items[0] || {}));
  console.log('Ocean.io first item sample:', JSON.stringify(items[0]).slice(0, 300));

  return items
    .filter(c => c.domain || c.website || c.companyDomain || c.url)
    .slice(0, MAX)
    .map(c => {
      // Handle all possible field name variants
      const domain = (c.domain || c.companyDomain || c.website || c.url || '')
        .replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase().trim();
      const name = c.name || c.companyName || c.company_name || domain;
      return { domain, name, score: c.score || c.matchRelevance || c.relevance || 0 };
    })
    .filter(c => c.domain);
}
