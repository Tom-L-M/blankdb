const crypto = require('crypto');

function logRequest (req, code, message) {
    console.log(
        JSON.stringify({ 
            timestamp:new Date().toISOString(), 
            client:req.session.rhost+':'+req.session.rport, 
            method: req.method, 
            url: req.url, 
            status: code>199 && code<300 ? 'accepted' : 'dropped', 
            code: code, 
            message: message 
        })
    );
}

function gatherPostData (req) {
    return new Promise ((resolve, reject) => {
        const acc = [];
        req.on('end', () => resolve(Buffer.concat(acc).toString()));
        req.on('data', chunk => acc.push(chunk));
    });
};

function safeParseJSON (data) {
    try {
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function decodeBase64 (string) {
    return Buffer.from(string, 'base64').toString('utf-8');
}

function credentialsFromRequest (authorizationHeader) {
    try {
        return decodeBase64(authorizationHeader.split(' ')[1]).split(':');
    } catch (err) {
        return null;
    }
}

function sha256 (data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Func is the function to debounce
// wait is the time to debounce the function on
// leading is if the first call should be executed or not
// trailing is if the last call should be executed or not
// cycle is if the Xth call should be executed or not
// callback is a function to run when timeout runs out (executed after the last call) 
function debounce (func, wait, { leading = true, trailing = true, cycle = 10 }, callback = () => {}) {
    let timerId;
    let calledDuringWait = false;
    let counter = 1;
  
    return function(...args) {
        // Count how many times the function was called, for the cycle counting
        if (cycle > 0) counter++;

        if (!timerId && leading) {
            // If it's the first call and leading is true, execute immediately and remove counter (to avoid overnumbering it)
            counter = 1;
            func.apply(this, args);
        } 
        
        else if (cycle > 0 && counter % cycle == 0) {
            // Or, if it is one of the Xth cycle calls, execute immediately too
            //  this is a safety measure, otherwise, an attacker could avoid a 
            //  database registration by flooding the server with replicate requests
            counter = 1;
            func.apply(this, args);
        } 
        
        else {
            // Mark that we need a trailing call
            calledDuringWait = true;
        }
  
        // Clear any existing timer
        clearTimeout(timerId);
    
        // Set a new timer
        timerId = setTimeout(() => {
            if (calledDuringWait && trailing && counter > 0) {
                // If there were calls during the wait, trailing is true, 
                // and the counter was not reset in the same cycle, execute the function
                counter = 1;
                func.apply(this, args);
            }
            // Reset state
            timerId = null;
            calledDuringWait = false;
            callback();
        }, wait);
    };
};

module.exports = { 
    sha256,
    gatherPostData, 
    safeParseJSON,
    decodeBase64,
    credentialsFromRequest,
    debounce,
    logRequest
};