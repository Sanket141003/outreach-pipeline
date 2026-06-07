import 'dotenv/config';
import chalk from 'chalk';
import readlineSync from 'readline-sync';
import { findLookalikeCompanies } from './stages/stage1_ocean.js';
import { findDecisionMakers } from './stages/stage2_prospeo.js';
import { resolveEmails } from './stages/stage3_eazyreach.js';
import { sendOutreachEmails } from './stages/stage4_brevo.js';
import { validateEnv } from './utils/validate.js';
import { logger } from './utils/logger.js';

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Automated Outreach Pipeline\n'));

  // Validate all env vars are set
  validateEnv();

  // --- INPUT ---
  const seedDomain = process.argv[2] || readlineSync.question(chalk.yellow('Enter seed domain (e.g. stripe.com): '));
  if (!seedDomain || !seedDomain.includes('.')) {
    logger.error('Invalid domain. Example: stripe.com');
    process.exit(1);
  }

  console.log(chalk.gray(`\nSeed domain: ${seedDomain}\n`));

  // --- STAGE 1: Ocean.io → Lookalike companies ---
  logger.stage(1, 'Finding lookalike companies via Ocean.io...');
  let companies = [];
  try {
    companies = await findLookalikeCompanies(seedDomain);
    logger.success(`Found ${companies.length} lookalike companies`);
    companies.forEach(c => console.log(chalk.gray(`  • ${c.name} (${c.domain})`)));
  } catch (err) {
    logger.error(`Stage 1 failed: ${err.message}`);
    process.exit(1);
  }

  if (companies.length === 0) {
    logger.error('No lookalike companies found. Try a different seed domain.');
    process.exit(1);
  }

  // --- STAGE 2: Prospeo → Decision makers ---
  logger.stage(2, 'Finding decision-makers via Prospeo...');
  let prospects = [];
  try {
    prospects = await findDecisionMakers(companies);
    logger.success(`Found ${prospects.length} decision-makers`);
    prospects.forEach(p => console.log(chalk.gray(`  • ${p.full_name} — ${p.job_title} @ ${p.company_domain}`)));
  } catch (err) {
    logger.error(`Stage 2 failed: ${err.message}`);
    process.exit(1);
  }

  if (prospects.length === 0) {
    logger.error('No decision-makers found. The pipeline cannot continue.');
    process.exit(1);
  }

  // --- STAGE 3: Eazyreach → Verified emails ---
  logger.stage(3, 'Resolving work emails via Eazyreach...');
  let contacts = [];
  try {
    contacts = await resolveEmails(prospects);
    logger.success(`Resolved ${contacts.length} verified emails`);
    contacts.forEach(c => console.log(chalk.gray(`  • ${c.full_name} → ${c.email}`)));
  } catch (err) {
    logger.error(`Stage 3 failed: ${err.message}`);
    process.exit(1);
  }

  if (contacts.length === 0) {
    logger.error('No emails could be resolved. Nothing to send.');
    process.exit(1);
  }

  // --- SAFETY CHECKPOINT ---
  console.log(chalk.yellow.bold('\n⚠️  Safety Checkpoint — Review before sending\n'));
  console.log(chalk.white(`About to send outreach emails to ${contacts.length} contact(s):\n`));
  contacts.forEach((c, i) => {
    console.log(chalk.white(`  ${i + 1}. ${c.full_name}`));
    console.log(chalk.gray(`     Title: ${c.job_title}`));
    console.log(chalk.gray(`     Email: ${c.email}`));
    console.log(chalk.gray(`     Company: ${c.company_name} (${c.company_domain})\n`));
  });

  const confirm = readlineSync.keyInYN(chalk.yellow('Proceed and send these emails?'));
  if (!confirm) {
    console.log(chalk.gray('\nAborted. No emails were sent.'));
    process.exit(0);
  }

  // --- STAGE 4: Brevo → Send emails ---
  logger.stage(4, 'Sending outreach emails via Brevo...');
  try {
    const results = await sendOutreachEmails(contacts, seedDomain);
    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    logger.success(`Sent: ${sent} | Failed: ${failed}`);
    results.forEach(r => {
      if (r.success) console.log(chalk.green(`  ✓ ${r.email}`));
      else console.log(chalk.red(`  ✗ ${r.email} — ${r.error}`));
    });
  } catch (err) {
    logger.error(`Stage 4 failed: ${err.message}`);
    process.exit(1);
  }

  console.log(chalk.cyan.bold('\n✅ Pipeline complete!\n'));
}

main();
