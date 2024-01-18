require('envine')(__dirname + '\\.env');

const server = require('./server');
const database = require('./source');

(async function main () {
    await server.start();
    
    // Use this to stop the service properly when shutting down
    process.once('SIGTERM', async (signal, code) => { 
        await server.close();
        database.save();
        process.exit(code);
    });

    process.once('SIGINT', async (signal, code) => { 
        await server.close();
        database.save();
        process.exit(code);
    });
})();