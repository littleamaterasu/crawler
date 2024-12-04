const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Tên file để lưu dữ liệu
let fileName;

// Tạo danh sách URL từ trang 1 đến 20
const baseUrls = [
    // 'https://vnexpress.net/thoi-su',
    // 'https://vnexpress.net/goc-nhin',
    // 'https://vnexpress.net/the-gioi',
    // 'https://vnexpress.net/podcast',
    // 'https://vnexpress.net/kinh-doanh',
    // 'https://vnexpress.net/bat-dong-san',
    // 'https://vnexpress.net/khoa-hoc',
    // 'https://vnexpress.net/giai-tri',
    // 'https://vnexpress.net/the-thao',
    // 'https://vnexpress.net/phap-luat',
    // 'https://vnexpress.net/giao-duc',
    // 'https://vnexpress.net/doi-song',
    // 'https://vnexpress.net/du-lich',
    // 'https://vnexpress.net/oto-xe-may',
    // 'https://vnexpress.net/y-kien',
    'https://vnexpress.net/kinh-doanh/chung-khoan'
];

const urls = [];
baseUrls.forEach(baseUrl => {
    urls.push(baseUrl); // Trang đầu tiên
    for (let i = 2; i <= 5; i++) {
        urls.push(`${baseUrl}-p${i}`);
    }
});

let articles = [];
const crawledLinks = new Set();

// Hàm ghi dữ liệu vào file
const writeDataToFile = () => {
    let existingData = [];
    if (fs.existsSync(fileName)) {
        const rawData = fs.readFileSync(fileName);
        existingData = JSON.parse(rawData);
    }
    existingData.push(...articles);

    fs.writeFile(fileName, JSON.stringify(existingData, null, 2), (err) => {
        if (err) {
            console.error(`Lỗi khi ghi vào file ${fileName}: ${err}`);
        } else {
            console.log(`Dữ liệu đã được lưu vào ${fileName}. Tổng số bài viết: ${existingData.length}`);
        }
    });

    articles = [];
};

// Hàm lấy chi tiết bài viết từ link cụ thể
const fetchArticleDetails = async (link) => {
    try {
        const response = await axios.get(link);
        const $ = cheerio.load(response.data);

        const timeAgo = $('span.date').text().trim() || 'Không có thông tin';
        const keywords = $('meta[name="news_keywords"]').attr('content') || '';
        const imageDiv = $('div.fig-picture source').first().attr('data-srcset');
        const imageUrl = imageDiv?.split(', ').find(src => src.includes('2x'))?.split(' ')[0] || '';

        let content = [];
        $('article.fck_detail p.Normal').each((index, element) => {
            const paragraphText = $(element).text().trim();
            if (paragraphText) {
                content.push(paragraphText);
            }
        });
        const articleText = content.join('\n\n');

        return { timeAgo, keywords, articleText, imageUrl };
    } catch (error) {
        console.error(`Lỗi khi lấy chi tiết bài viết từ ${link}: ${error}`);
        return { timeAgo: 'Không có thông tin', keywords: '', articleText: '', imageUrl: '' };
    }
};

// Hàm lấy danh sách bài viết từ một URL
const fetchDataFromUrl = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const articleElements = $('article.item-news');
        for (let index = 0; index < articleElements.length; index++) {
            const element = articleElements[index];
            const link = $(element).find('a').attr('href');
            const title = $(element).find('h3.title-news a').text().trim();
            const description = $(element).find('p.description a').text().trim();

            if (title && link && description) {
                const fullLink = new URL(link, url).href;
                if (!crawledLinks.has(fullLink)) {
                    const { timeAgo, keywords, articleText, imageUrl } = await fetchArticleDetails(fullLink);
                    const articleData = {
                        title: title,
                        link: fullLink,
                        description: description,
                        timeAgo: timeAgo,
                        keywords: keywords,
                        content: articleText,
                        imageUrl: imageUrl
                    };
                    console.log('crawled', link)
                    crawledLinks.add(fullLink);
                    articles.push(articleData);
                }
            }

            await sleep(100); // Chờ 0.5 giây trước khi lấy bài viết tiếp theo
        }
    } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu từ ${url}: ${error}`);
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const main = async () => {
    console.log('Bắt đầu crawl dữ liệu...');
    for (let i = 0; i < urls.length; ++i) {
        fileName = `data__${i + 1}.json`; // Tạo file dữ liệu riêng cho mỗi URL
        console.log(`Đang crawl URL: ${urls[i]}`);
        await fetchDataFromUrl(urls[i]);
        writeDataToFile();
        await sleep(5000); // Chờ 5 giây để tránh bị chặn
    }
    console.log('Hoàn tất crawl dữ liệu.');
};

main();
