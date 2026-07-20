const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();

const RSS_SOURCES = [
  { name: 'Detik', url: 'https://news.detik.com/berita/rss' },
  { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss' }
];

function cleanText(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeSummary(text, maxWords = 50) {
  const cleaned = cleanText(text);
  const words = cleaned.split(' ');
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(' ') + '...';
}

function getImage(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
    return item['media:content'].$.url;
  }
  return 'https://picsum.photos/id/' + Math.floor(Math.random() * 100) + '/800/600';
}

async function fetchRSS() {
  let allArticles = [];
  let idCounter = 1000;

  for (const source of RSS_SOURCES) {
    try {
      console.log('Mengambil dari ' + source.name + '...');
      const feed = await parser.parseURL(source.url);
      
      const items = (feed.items || []).slice(0, 5);
      
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

      console.log('Berhasil ambil ' + items.length + ' berita dari ' + source.name);
    } catch (err) {
      console.error('Gagal ambil ' + source.name + ':', err.message);
    }
  }

  fs.writeFileSync('rss-articles.json', JSON.stringify(allArticles, null, 2));
  console.log('Total berita tersimpan: ' + allArticles.length);
}

fetchRSS().catch(err => {
  console.error('Error utama:', err);
  fs.writeFileSync('rss-articles.json', '[]');
});
