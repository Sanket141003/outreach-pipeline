/**
 * Stage 1 — Ocean.io
 * Takes a seed domain and returns a list of lookalike company domains.
 *
 * Ocean.io API endpoint: POST https://api.ocean.io/v2/search
 * Auth: x-api-key header
 * Docs: https://ocean.io (login required)
 */
import axios from 'axios';
import { logger } from '../utils/logger.js';

const MAX = parseInt(process.env.MAX_LOOKALIKES || '5', 10);
const BASE_URL = 'https://api.ocean.io/v2';

export async function findLookalikeCompanies(seedDomain) {
  logger.info(`Querying Ocean.io for lookalikes of: ${seedDomain}`);

  const response = await axios.post(
    `${BASE_URL}/search`,
    {
      lookalike: seedDomain,
      size: MAX,
    },
    {
      headers: {
        'x-api-key': process.env.OCEAN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const data = response.data;

  // Response shape: { results: [{ domain, name, score, ... }], companies: [...] }
  const results = data.results || [];
  if (results.length === 0) {
    logger.warn('Ocean.io returned 0 results. Check your API key and seed domain.');
    return [];
  }

  return results
    .filter(c => c.domain && c.name)
    .slice(0, MAX)
    .map(c => ({
      domain: c.domain.toLowerCase().trim(),
      name: c.name,
      score: c.score || 0,
    }));
}
