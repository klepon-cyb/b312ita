name: Update RSS Articles

on:
  schedule:
    - cron: '0 3 * * *'   # 10:00 WIB
    - cron: '0 8 * * *'   # 15:00 WIB
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install rss-parser

      - name: Run update script
        run: node update-rss.js

      - name: Commit changes
        run: |
          git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add rss-articles.json
          git status
          
          if git diff --staged --quiet; then
            echo "Tidak ada perubahan"
          else
            git commit -m "Update RSS articles - $(date '+%Y-%m-%d %H:%M')"
            git push
          fi
