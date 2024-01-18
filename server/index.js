const app = require('slower')();
const routes = require('./routes');

app.parse(routes);

app.setAllowedMethods(['GET', 'POST']);

module.exports = ({
    start: async () => {
        await app.start(process.env.PORT, process.env.HOST);
        console.log(`<> Running on http://${process.env.HOST}:${process.env.PORT}/`)
    },
    close: async () => {
        await app.close({ forceDisconnection: true, silent: false });
        console.log(`<> Stopped service on http://${app.host}:${app.port}/`);
    }
});