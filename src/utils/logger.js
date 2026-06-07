import chalk from 'chalk';

export const logger = {
  stage: (num, msg) => console.log(chalk.blue.bold(`\n[Stage ${num}] `) + chalk.white(msg)),
  success: (msg) => console.log(chalk.green('✓ ') + chalk.white(msg)),
  error: (msg) => console.log(chalk.red('✗ Error: ') + chalk.white(msg)),
  warn: (msg) => console.log(chalk.yellow('⚠ ') + chalk.white(msg)),
  info: (msg) => console.log(chalk.gray('  ' + msg)),
};
