const fs = require('fs');
const path = require('path');

// Đọc file data.json
const inputFilePath = path.join(__dirname, 'data.json');
const outputFilePath = path.join(__dirname, 'bulk.json');

try {
    // Đọc dữ liệu từ data.json
    const inputData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    // Kiểm tra dữ liệu đầu vào phải là một mảng
    if (!Array.isArray(inputData)) {
        throw new Error('Dữ liệu đầu vào phải là một mảng.');
    }

    const bulkData = [];

    // Tạo dữ liệu dạng bulk
    inputData.forEach((item, index) => {
        bulkData.push({ index: { _index: 'test', _id: (index + 1).toString() } }); // Metadata
        bulkData.push(item); // Dữ liệu thực tế
    });

    // Ghi vào file bulk.json
    fs.writeFileSync(outputFilePath, bulkData.map(JSON.stringify).join('\n') + '\n', 'utf8');
    console.log(`File bulk.json đã được tạo tại ${outputFilePath}`);
} catch (err) {
    console.error('Lỗi:', err.message);
}
