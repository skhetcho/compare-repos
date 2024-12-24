import { Command } from 'commander';
import chalk from 'chalk';
import { RepoComparator } from './repoComparator.js';

const program = new Command();

program
  .name('compare-repos')
  .description('Compare two code repositories')
  .version('1.0.0')
  .argument('<repo1>', 'Path to first repository')
  .argument('<repo2>', 'Path to second repository')
  .option('-t, --threshold <number>', 'Similarity threshold percentage', '80')
  .option('--ignore <patterns>', 'Additional ignore patterns (comma-separated)')
  .option('--json', 'Output results as JSON')
  .action(async (repo1: string, repo2: string, options) => {
    try {
      const threshold = parseInt(options.threshold);
      const ignorePatterns = options.ignore?.split(',') || [];
      
      console.log(chalk.blue('🔍 Comparing repositories...'));
      console.log(chalk.gray(`Repo 1: ${repo1}`));
      console.log(chalk.gray(`Repo 2: ${repo2}\n`));

      const comparator = new RepoComparator(repo1, repo2, threshold, ignorePatterns);
      const comparison = await comparator.compareRepositories();

      if (options.json) {
        console.log(JSON.stringify(comparison, null, 2));
      } else {
        console.log(RepoComparator.formatComparison(comparison));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();