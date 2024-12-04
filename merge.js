const fs = require('fs');
const path = require('path');

const outputFilePath = path.join(__dirname, 'data.json');
const mergedData = [];

for (let i = 1; i <= 70; i++) {
    const filePath = path.join(__dirname, `data__${i}.json`);
    try {
        if (fs.existsSync(filePath)) {
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            mergedData.push(...fileData); // Gộp dữ liệu vào mảng chính
        }
    } catch (err) {
        console.error(`Lỗi khi đọc file ${filePath}:`, err.message);
    }
}

// Ghi kết quả vào file data.json
try {
    fs.writeFileSync(outputFilePath, JSON.stringify(mergedData, null, 2), 'utf8');
    console.log(`Dữ liệu đã được gộp thành công vào ${outputFilePath}`);
} catch (err) {
    console.error(`Lỗi khi ghi file ${outputFilePath}:`, err.message);
}
