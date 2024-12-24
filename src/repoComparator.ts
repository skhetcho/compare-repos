import * as fs from 'fs';
import * as path from 'path';
import { diffLines, Change } from 'diff';
import chalk from 'chalk';

interface FileComparison {
  similarity: number;
  differences: Change[];
  path: string;
}

interface ComparisonSummary {
  totalFiles: {
    repo1: number;
    repo2: number;
  };
  fileExtensions: string[];
  uniqueToRepo1: string[];
  uniqueToRepo2: string[];
  identicalFiles: string[];
  similarFiles: string[];
  differentFiles: string[];
}

interface DetailedComparison {
  summary: ComparisonSummary;
  fileComparisons: Record<string, FileComparison>;
}

export class RepoComparator {
  private readonly defaultIgnoredDirs = new Set([
    '.git',
    'node_modules',
    'dist',
    'build',
    'coverage'
  ]);

  private readonly fileExtensions = new Set<string>();

  constructor(
    private readonly repo1Path: string,
    private readonly repo2Path: string,
    private readonly similarityThreshold: number = 80,
    private readonly additionalIgnorePatterns: string[] = []
  ) {
    this.validatePaths();
  }

  private validatePaths(): void {
    if (!fs.existsSync(this.repo1Path)) {
      throw new Error(`Repository 1 path does not exist: ${this.repo1Path}`);
    }
    if (!fs.existsSync(this.repo2Path)) {
      throw new Error(`Repository 2 path does not exist: ${this.repo2Path}`);
    }
  }

  private shouldIgnore(entryPath: string): boolean {
    const basename = path.basename(entryPath);
    return (
      this.defaultIgnoredDirs.has(basename) ||
      this.additionalIgnorePatterns.some(pattern => 
        entryPath.includes(pattern) || basename === pattern
      )
    );
  }

  private async getFiles(repoPath: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    const processDirectory = async (currentPath: string, baseDir: string): Promise<void> => {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
          if (!this.shouldIgnore(fullPath)) {
            await processDirectory(fullPath, baseDir);
          }
        } else {
          this.fileExtensions.add(path.extname(entry.name));
          files.set(relativePath, fullPath);
        }
      }
    };

    await processDirectory(repoPath, repoPath);
    return files;
  }

  private async compareFiles(file1Path: string, file2Path: string): Promise<FileComparison> {
    try {
      const [content1, content2] = await Promise.all([
        fs.promises.readFile(file1Path, 'utf8'),
        fs.promises.readFile(file2Path, 'utf8')
      ]);

      const differences = diffLines(content1, content2);
      
      const totalLines = differences.reduce((sum, change) => sum + (change.count || 0), 0);
      const changedLines = differences.reduce((sum, change) => 
        sum + (change.added || change.removed ? (change.count || 0) : 0), 0
      );
      const similarity = ((totalLines - changedLines) / totalLines) * 100;

      return {
        similarity: Math.round(similarity * 100) / 100,
        differences,
        path: file1Path
      };
    } catch (error) {
      console.error(chalk.red(`Error comparing files ${file1Path} and ${file2Path}:`), error);
      throw error;
    }
  }

  public async compareRepositories(): Promise<DetailedComparison> {
    const [repo1Files, repo2Files] = await Promise.all([
      this.getFiles(this.repo1Path),
      this.getFiles(this.repo2Path)
    ]);

    const repo1Paths = new Set(repo1Files.keys());
    const repo2Paths = new Set(repo2Files.keys());

    const commonPaths = new Set([...repo1Paths].filter(x => repo2Paths.has(x)));
    const uniqueToRepo1 = [...repo1Paths].filter(x => !repo2Paths.has(x));
    const uniqueToRepo2 = [...repo2Paths].filter(x => !repo1Paths.has(x));

    const fileComparisons: Record<string, FileComparison> = {};
    const identicalFiles: string[] = [];
    const similarFiles: string[] = [];
    const differentFiles: string[] = [];

    // Compare common files
    for (const relativePath of commonPaths) {
      const comparison = await this.compareFiles(
        repo1Files.get(relativePath)!,
        repo2Files.get(relativePath)!
      );

      fileComparisons[relativePath] = comparison;

      if (comparison.similarity === 100) {
        identicalFiles.push(relativePath);
      } else if (comparison.similarity >= this.similarityThreshold) {
        similarFiles.push(relativePath);
      } else {
        differentFiles.push(relativePath);
      }
    }

    return {
      summary: {
        totalFiles: {
          repo1: repo1Files.size,
          repo2: repo2Files.size
        },
        fileExtensions: [...this.fileExtensions],
        uniqueToRepo1,
        uniqueToRepo2,
        identicalFiles,
        similarFiles,
        differentFiles
      },
      fileComparisons
    };
  }

  public static formatComparison(comparison: DetailedComparison): string {
    const { summary, fileComparisons } = comparison;
    
    let output = '';
    
    output += chalk.bold.blue('📊 Repository Comparison Summary\n');
    output += chalk.gray('============================\n\n');
    
    output += chalk.white(`📁 Files in Repository 1: ${summary.totalFiles.repo1}\n`);
    output += chalk.white(`📁 Files in Repository 2: ${summary.totalFiles.repo2}\n\n`);
    
    output += chalk.white(`🔍 File Extensions: ${summary.fileExtensions.join(', ')}\n\n`);
    
    output += chalk.bold('⚡ Quick Stats:\n');
    output += chalk.yellow(`  • Unique to Repo 1: ${summary.uniqueToRepo1.length} files\n`);
    output += chalk.yellow(`  • Unique to Repo 2: ${summary.uniqueToRepo2.length} files\n`);
    output += chalk.green(`  • Identical Files: ${summary.identicalFiles.length}\n`);
    output += chalk.blue(`  • Similar Files: ${summary.similarFiles.length}\n`);
    output += chalk.red(`  • Different Files: ${summary.differentFiles.length}\n\n`);
    
    output += chalk.bold.blue('📄 Detailed File Comparisons\n');
    output += chalk.gray('-------------------------\n\n');
    
    Object.entries(fileComparisons).forEach(([filePath, comparison]) => {
      output += chalk.bold(`File: ${filePath}\n`);
      const similarityColor = 
        comparison.similarity === 100 ? chalk.green :
        comparison.similarity >= 80 ? chalk.blue :
        chalk.red;
      output += similarityColor(`Similarity: ${comparison.similarity}%\n`);
      
      if (comparison.differences.length > 1) {
        output += chalk.white('Changes:\n');
        comparison.differences.forEach(change => {
          if (change.added || change.removed) {
            const changeColor = change.added ? chalk.green : chalk.red;
            const prefix = change.added ? '+' : '-';
            const lines = change.value.split('\n')
              .filter(line => line.trim())
              .map(line => changeColor(`  ${prefix} ${line}`))
              .join('\n');
            output += lines + '\n';
          }
        });
      }
      output += '\n';
    });
    
    return output;
  }
}