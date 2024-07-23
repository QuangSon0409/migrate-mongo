const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Thư mục chứa các file JSON
const exportDir = path.join(__dirname, 'mongodbExport');
// Thông tin kết nối MongoDB
const mongoUri = 'mongodb://admin:password123@172.16.3.10:27017/';

// Hàm để phân tích tên database và collection từ tên file
function parseFileName(fileName) {
    const match = fileName.match(/^(.+?)_(.+)\.json$/);
    if (match) {
        const dbName = match[1];
        const collectionName = match[2].replace(/_/g, '_');
        return { dbName, collectionName };
    }
    throw new Error(`File name ${fileName} không hợp lệ. Định dạng đúng là <dbName>_<collectionName>.json`);
}


// Hàm nhập dữ liệu từ file JSON vào MongoDB
function importData(filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const { dbName, collectionName } = parseFileName(fileName);
        const command = `mongoimport --uri="${mongoUri}${dbName}?authSource=admin" --collection=${collectionName} --file="${filePath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error importing ${filePath}: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.warn(`stderr: ${stderr}`);
            }
            console.log(`Imported ${filePath} into collection ${collectionName} of database ${dbName}`);
            resolve();
        });
    });
}

// Hàm chính để xử lý việc nhập dữ liệu
async function importAllData() {
    try {
        const files = fs.readdirSync(exportDir).filter(file => file.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(exportDir, file);
            await importData(filePath);
        }
        console.log('All files have been imported successfully.');
    } catch (error) {
        console.error('Error during import:', error);
    }
}

importAllData();
