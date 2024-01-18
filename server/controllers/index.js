const interface = require('../models/interface');
const utils = require('../../helpers/utils');

const controllers = {};

controllers.fallback = (req, res) => {
    utils.logRequest(req, 404, 'Resource Not Found');
    res.sendJSON({ ok: false, data: 'Resource Not Found' }, 404);
}

controllers.serverHello = (req, res) => {
    utils.logRequest(req, 200, 'Hello From Server!');
    res.sendJSON({ ok: true, data: 'Hello From Server!' }, 200);
}

controllers.deferOperation = (req, res, op) => {
    utils.logRequest(req, 200, 'Queued Operation ' + op);
    res.sendJSON(interface.queueOperation(op, req.components), 200);
}

module.exports = controllers;