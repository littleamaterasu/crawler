const fs = require('fs');

const linkFilePath = 'link.json'
// Hàm đọc file link.json
const readLinksFromFile = () => {
    try {
        if (fs.existsSync(linkFilePath)) {
            const data = fs.readFileSync(linkFilePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Lỗi khi đọc file link.json:', error);
    }
    return [];
};

// Hàm ghi link vào file link.json
const writeLinkToFile = (link) => {
    try {
        const existingLinks = readLinksFromFile();
        existingLinks.push(link);
        fs.writeFileSync(linkFilePath, JSON.stringify(existingLinks, null, 2));
    } catch (error) {
        console.error('Lỗi khi ghi link vào file link.json:', error);
    }
};

// Hàm kiểm tra trùng lặp bằng Elasticsearch
const isDuplicate = (link) => {
    const existingLinks = readLinksFromFile();
    return existingLinks.includes(link);
};

module.exports = { writeLinkToFile, isDuplicate }