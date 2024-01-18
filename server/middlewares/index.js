const interface = require('../models/interface');
const utils = require('../../helpers/utils');

const middlewares = {};

middlewares.auth = (req, res) => {
    const namespaceFromURL = () => req.url.split('/')[3];
    if (!req.headers.authorization) {
        res.writeHead(401, 'Missing Authorization Header', { 
            'Content-Type': 'text/plain',
            'WWW-Authenticate': 'Basic realm="IVRealm", charset="UTF-8"'
        });
        utils.logRequest(req, 401, 'Missing Authorization Header');
        return res.end();
    } 

    else {
        const credentials = utils.credentialsFromRequest(req.headers.authorization); // -> returns an array with [ user, password ]
        let authentication = 0;

        if (credentials && credentials.length === 2) {
            authentication = 
                interface.authenticate(...credentials) ||
                interface.authenticate(...credentials, namespaceFromURL())
            ;
        }

        if (authentication > 0) {
            req.authlevel = authentication;
            return;
        } else {
            res.writeHead(403, 'Forbidden: Invalid Credentials', { 'Content-Type': 'text/plain' });
            utils.logRequest(req, 403, 'Forbidden: Invalid Credentials');
            return res.end();
        }
    }
};

middlewares.schema = async (req, res) => {
    if (req.method === 'POST') {
        req.collected = await utils.gatherPostData(req);
        req.collected = utils.safeParseJSON(req.collected);
        if (req.collected) {
            if (!interface.validateBody(req.collected)) {
                res.writeHead(400, 'Invalid Request Body', { 'Content-Type': 'text/plain' });
                utils.logRequest(req, 400, 'Invalid Request Body');
                return res.end();
            }
        }
    };
};

middlewares.components = (req, res) => {
    let splitted = req.url.split('/').filter(v => !!v);

    return req.components = {
        data: req.collected?.data,
        scope: splitted[0],
        action: splitted[1],
        namespace: splitted[2],
        collection: splitted[3],
        document: splitted[4],
        // The 'user' position may be either [2] or [3] so it is set as com.dbuser and com.nsuser respectively
        dbuser: splitted[2],
        nsuser: splitted[3],
        authlevel: req.authlevel
    };
}

module.exports = middlewares;