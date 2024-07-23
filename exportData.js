const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Thông tin kết nối MongoDB
const mongoUri = 'mongodb://localhost:27017/';
let mongoExport = 'mongodb://localhost:27017/apm?authSource=admin';
// Kết nối đến MongoDB
const exportDir = path.join(__dirname, 'mongodbExport');
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
}
async function exportAllData() {
    const client = new MongoClient(mongoUri, { useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // Lấy danh sách tất cả các database
        const adminDb = client.db().admin();
        const databases = await adminDb.listDatabases();

        for (const databaseInfo of databases.databases) {
            const dbName = databaseInfo.name;
            const db = client.db(dbName);
            console.log(`Processing database: ${dbName}`);

            // Lấy danh sách các collections trong từng database
            const collections = await db.listCollections().toArray();

            for (const collection of collections) {
                const collectionName = collection.name;
                const outputFile = path.join(exportDir, `${dbName}_${collectionName}.json`);
                const command = `mongoexport --uri="${mongoExport.replace('/apm', `/${dbName}`)}" --collection=${collectionName} --out=${outputFile}`;
                // console.log('Processing outputFile:', outputFile);
                // console.log("mongoUri export", mongoUri)
                // console.log("command:", command);

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error exporting ${collectionName} from ${dbName}: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`stderr: ${stderr}`);
                        return;
                    }
                    console.log(`Exported ${collectionName} from ${dbName} to ${outputFile}`);
                });
            }
        }

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    } finally {
        await client.close();
    }
}

exportAllData();
