const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { Client } = require("@elastic/elasticsearch");
const { KafkaClient, Producer } = require('kafka-node');

// Cấu hình Kafka
const kafkaClient = new KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new Producer(kafkaClient);
const kafkaTopic = 'training-data';

// Cấu hình Elasticsearch
const elasticsearchUrl = 'http://172.30.34.103:9200';
const elasticsearchIndexName = 'crawled-stock-data';
const elasticsearchAnalyzer = 'my_vi_analyzer';

const client = new Client({
    node: elasticsearchUrl
});

const urls = [
    'https://vnexpress.net/kinh-doanh/chung-khoan',
    ...Array.from({ length: 20 }, (_, i) => `https://vnexpress.net/kinh-doanh/chung-khoan-p${i + 1}`)
];

let articles = [];

// Hàm kiểm tra trùng lặp bằng Elasticsearch
const isDuplicate = async (link) => {
    const { body } = await client.search({
        index: elasticsearchIndexName,
        body: {
            query: {
                match: { link }
            }
        }
    });
    return body.hits.total.value > 0;
};

// Hàm tokenize bằng Elasticsearch Analyzer
const getTokens = async (text) => {
    const { body } = await client.indices.analyze({
        index: elasticsearchIndexName,
        body: {
            analyzer: elasticsearchAnalyzer,
            text
        }
    });
    return body.tokens.map(token => token.token);
};

// Hàm đẩy dữ liệu qua Kafka
const sendToKafka = (data) => {
    const payloads = [{ topic: kafkaTopic, messages: JSON.stringify(data) }];
    producer.send(payloads, (err, data) => {
        if (err) {
            console.error(`Lỗi khi gửi Kafka: ${err}`);
        } else {
            console.log('Đã gửi dữ liệu qua Kafka:', data);
        }
    });
};

// Hàm lấy chi tiết bài viết
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

// Hàm lấy danh sách bài viết
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
                if (await isDuplicate(fullLink)) {
                    console.log(`Bỏ qua bài viết đã tồn tại: ${fullLink}`);
                    continue;
                }

                const { timeAgo, keywords, articleText, imageUrl } = await fetchArticleDetails(fullLink);

                const tokens = [
                    ...(await getTokens(description)),
                    ...(await getTokens(articleText))
                ];

                const dataToKafka = { tokens, keywords };
                sendToKafka(dataToKafka);

                articles.push({
                    title,
                    link: fullLink,
                    description,
                    timeAgo,
                    keywords,
                    content: articleText,
                    imageUrl
                });
                console.log(`Đã crawl: ${fullLink}`);
            }
            await sleep(100);
        }
    } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu từ ${url}: ${error}`);
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Chương trình chính
const main = async () => {
    console.log('Bắt đầu crawl dữ liệu...');
    for (let i = 0; i < urls.length; i++) {
        console.log(`Đang crawl URL: ${urls[i]}`);
        await fetchDataFromUrl(urls[i]);
        await sleep(5000);
    }
    console.log('Hoàn tất crawl dữ liệu.');
};

main();
