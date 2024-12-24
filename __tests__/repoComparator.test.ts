import { RepoComparator } from '../src/repoComparator';
import * as fs from 'fs';
import * as path from 'path';

describe('RepoComparator', () => {
  const testDir1 = path.join(__dirname, 'test-repo-1');
  const testDir2 = path.join(__dirname, 'test-repo-2');

  beforeAll(() => {
    // Create test directories and files
    [testDir1, testDir2].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Create test files
    fs.writeFileSync(path.join(testDir1, 'test1.txt'), 'Hello World');
    fs.writeFileSync(path.join(testDir2, 'test1.txt'), 'Hello World');
    fs.writeFileSync(path.join(testDir2, 'test2.txt'), 'Different content');
  });

  afterAll(() => {
    // Clean up test directories
    [testDir1, testDir2].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  it('should compare repositories correctly', async () => {
    const comparator = new RepoComparator(testDir1, testDir2);
    const result = await comparator.compareRepositories();

    expect(result.summary.totalFiles.repo1).toBe(1);
    expect(result.summary.totalFiles.repo2).toBe(2);
    expect(result.summary.identicalFiles).toHaveLength(1);
  });
});