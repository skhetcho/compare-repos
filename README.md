# compare-repos

A command-line tool to compare two code repositories and analyze their similarities and differences.

## Features

- Compare files across two repositories
- Calculate similarity percentages
- Show detailed diffs for changed files
- Colorized output
- Configurable ignore patterns
- JSON output option for programmatic use

## Installation

```bash
# Install globally
npm install -g compare-repos

# Or use with npx
npx compare-repos
```

## Usage

Basic comparison:
```bash
compare-repos ./project1 ./project2
```

With options:
```bash
# Set custom similarity threshold (default: 80)
compare-repos ./project1 ./project2 -t 90

# Add custom ignore patterns
compare-repos ./project1 ./project2 --ignore ".env,.DS_Store"

# Output as JSON
compare-repos ./project1 ./project2 --json
```

## Options

- `-t, --threshold <number>` - Similarity threshold percentage (default: 80)
- `--ignore <patterns>` - Additional ignore patterns (comma-separated)
- `--json` - Output results as JSON
- `-v, --version` - Show version
- `-h, --help` - Show help

## Development

Clone the repository:
```bash
git clone https://github.com/skhetcho/compare-repos.git
cd compare-repos
```

Install dependencies:
```bash
npm install
```

Build the project:
```bash
npm run build
```

Run locally:
```bash
npm start -- ./project1 ./project2
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Author

Souren Khetcho