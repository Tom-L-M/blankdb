const controllers = require("../controllers");
const middlewares = require("../middlewares");

// WARNING: DONT CHANGE THE DECLARATION ORDER
const routes = [
    { type: 'middleware', handle: middlewares.auth       }, // Check auth level
    { type: 'middleware', handle: middlewares.schema     }, // Validate data sent with JSON
    { type: 'middleware', handle: middlewares.components }, // Split URL in scope components
    { type: 'fallback',   handle: controllers.fallback   }, // 404 fallback route

    // Just server hello
    { type: "route", path: "/", method: "GET", handle: controllers.serverHello },

    // Creating a namespace:
    // Route: GET /nsp/new/<namespace-name>
    { type: "route", path: "/nsp/new/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'createNamespace') },

    // Deleting a namespace:
    // Route: GET /nsp/del/<namespace-name>
    { type: "route", path: "/nsp/del/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'removeNamespace') },

    // Get all namespace names: 
    // Route: GET /nsp/all
    { type: "route", path: "/nsp/all", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getAllNamespaces') },

    // Create database user:
    // Route: POST /dbu/new/<user-name>
    // Data: The user password
    { type: "route", path: "/dbu/new/{*}", method: "POST", handle: (...r) => controllers.deferOperation(...r, 'createDatabaseUser') },

    // Delete database user:
    // Credentials: Database User + Database Password
    // Route: GET /dbu/del/<user-name>
    { type: "route", path: "/dbu/del/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'removeDatabaseUser') },
    
    // Get database user:
    // Credentials: Database User + Database Password
    // Route: GET /dbu/get/<user-name>
    { type: "route", path: "/dbu/get/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getDatabaseUser') },
    
    // Get all database users:
    // Credentials: Database User + Database Password
    // Route: GET /dbu/all
    { type: "route", path: "/dbu/all", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getAllDatabaseUsers') },
    
    // Creating a collection:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /col/new/<namespace-name>/<collection-name>
    { type: "route", path: "/col/new/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'createCollection') },

    // Deleting a collection:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /col/del/<namespace-name>/<collection-name>
    { type: "route", path: "/col/del/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'removeCollection') },

    // Get names of all collections:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /col/all/<namespace-name>
    { type: "route", path: "/col/all/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getAllCollections') },

    // Creating a document:
    // Credentials: Namespace User + Namespace Password
    // Route: POST /doc/new/<namespace-name>/<collection-name>/<document-name>
    // Data: The document data
    { type: "route", path: "/doc/new/{*}/{*}/{*}", method: "POST", handle: (...r) => controllers.deferOperation(...r, 'createDocument') },

    // Deleting a document:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /doc/del/<namespace-name>/<collection-name>/<document-name>
    { type: "route", path: "/doc/del/{*}/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'removeDocument') },

    // Get a document's data:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /doc/get/<namespace-name>/<collection-name>/<document-name>
    { type: "route", path: "/doc/get/{*}/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getDocument') },

    // Get names of all documents from a collection:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /doc/all/<namespace-name>/<collection-name>
    { type: "route", path: "/doc/all/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getAllDocuments') },

    // Creating user:
    // Credentials: Namespace User + Namespace Password
    // Route: POST /usr/new/<namespace-name>/<user-name>
    // Data: The user password
    { type: "route", path: "/usr/new/{*}/{*}", method: "POST", handle: (...r) => controllers.deferOperation(...r, 'createNamespaceUser') },

    // Deleting user:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /usr/del/<namespace-name>/<user-name>
    { type: "route", path: "/usr/del/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'removeNamespaceUser') },

    // Get namespace user:
    // Credentials: None (needed for auth)
    // Route: GET /usr/get/<user-name>/<namespace-name>
    { type: "route", path: "/usr/get/{*}/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getNamespaceUser') },

    // Get all namespace users:
    // Credentials: Namespace User + Namespace Password
    // Route: GET /usr/all/<namespace-name>
    { type: "route", path: "/usr/all/{*}", method: "GET", handle: (...r) => controllers.deferOperation(...r, 'getAllNamespaceUsers') },

];

module.exports = routes;