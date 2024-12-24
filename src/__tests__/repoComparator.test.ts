// src/__tests__/repoComparator.test.ts
import { RepoComparator } from '../repoComparator.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('RepoComparator', () => {
  const testDir1 = path.join(os.tmpdir(), 'test-repo-1');
  const testDir2 = path.join(os.tmpdir(), 'test-repo-2');

  beforeEach(() => {
    // Clean up and create test directories before each test
    [testDir1, testDir2].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
      fs.mkdirSync(dir, { recursive: true });
    });
  });

  afterAll(() => {
    // Clean up test directories
    [testDir1, testDir2].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  it('should identify similar files', async () => {
    // Create files with similar content
    const file1Path = path.join(testDir1, 'similar.txt');
    const file2Path = path.join(testDir2, 'similar.txt');
    
    fs.writeFileSync(file1Path, 'Hello World\nThis is a test');
    fs.writeFileSync(file2Path, 'Hello World\nThis is a test file');

    const comparator = new RepoComparator(testDir1, testDir2);
    const result = await comparator.compareRepositories();

    console.log('\n--- Debug Information ---');
    console.log('Test Files:');
    console.log('File 1:', file1Path);
    console.log('Content 1:', fs.readFileSync(file1Path, 'utf8'));
    console.log('File 2:', file2Path);
    console.log('Content 2:', fs.readFileSync(file2Path, 'utf8'));
    
    console.log('\nSummary:');
    console.log('Total files in repo1:', result.summary.totalFiles.repo1);
    console.log('Total files in repo2:', result.summary.totalFiles.repo2);
    console.log('Identical files:', result.summary.identicalFiles);
    console.log('Similar files:', result.summary.similarFiles);
    console.log('Different files:', result.summary.differentFiles);

    if (result.fileComparisons['similar.txt']) {
      console.log('\nComparison Details for similar.txt:');
      const comparison = result.fileComparisons['similar.txt'];
      console.log('Similarity percentage:', comparison.similarity);
      console.log('Raw differences:', JSON.stringify(comparison.differences, null, 2));
    } else {
      console.log('\nWARNING: No comparison found for similar.txt');
      console.log('Available comparisons:', Object.keys(result.fileComparisons));
    }

    expect(result.summary.similarFiles.length).toBeGreaterThan(0);
    if (result.fileComparisons['similar.txt']) {
      expect(result.fileComparisons['similar.txt'].similarity).toBeGreaterThanOrEqual(80);
    }
  });
});