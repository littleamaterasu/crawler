const { KafkaClient, Producer } = require('kafka-node');
require('dotenv').config();

// Cấu hình Kafka
const kafkaClient = new KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const producer = new Producer(kafkaClient);
const kafkaTopic = 'crawled-data';

const saveToElasticsearch = async (article) => {
    try {
        producer.send(
            [{ topic: kafkaTopic, messages: JSON.stringify(article) }],
            (err, data) => {
                if (err) console.error('Kafka Error:', err);
                else console.log('Data sent to Kafka:', data);
            }
        );
        console.log(`Đã lưu bài viết vào Elasticsearch: ${article.link}`);
    } catch (error) {
        console.error(`Lỗi khi lưu vào Elasticsearch: ${error}`);
    }
};

module.exports = { saveToElasticsearch }