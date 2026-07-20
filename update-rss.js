const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', 'description']
  }
});

const RSS_SOURCES = [
  { name: 'Detik', url: 'https://news.detik.com/berita/rss' },
  { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss' },
  { name: 'Kompas', url: 'https://rss.kompas.com/api/feed/news' } // fallback jika tidak jalan, nanti diganti
];

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeSummary(text, maxWords = 50) {
  const cleaned = cleanText(text);
  const words = cleaned.split(' ');
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(' ') + '...';
}

function getImage(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  if (item['media:content'] && item['media:content'].$.url) return item['media:content'].$.url;
  if (item.content && item.content.includes('src=')) {
    const match = item.content.match(/src="([^"]+)"/);
    if (match) return match[1];
  }
  return 'https://picsum.photos/id/32/800/600';
}

async function fetchRSS() {
  let allArticles = [];
  let idCounter = 1000; // biar tidak bentrok dengan manual

  for (const source of RSS_SOURCES) {
    try {
      console.log(`Mengambil dari ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      
      const items = feed.items.slice(0, 5); // ambil 5 berita
      
      items.forEach(item => {
        allArticles.push({
          id: idCounter++,
          title: item.title || 'Tanpa Judul',
          summary: makeSummary(item.contentSnippet || item.content || item.description || '', 50),
          content: item.content || item.contentSnippet || item.description || '',
          image: getImage(item),
          category: 'Berita',
          source: source.name,
          date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'),
          link: item.link || '#'
        });
      });
    } catch (err) {
      console.error(`Gagal ambil ${source.name}:`, err.message);
    }
  }

  // Simpan ke file
  fs.writeFileSync('rss-articles.json', JSON.stringify(allArticles, null, 2));
  console.log(`Berhasil menyimpan ${allArticles.length} berita ke rss-articles.json`);
}

fetchRSS();
