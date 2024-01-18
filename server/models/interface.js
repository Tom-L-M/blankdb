// use this to place methods to interact with the database
// no files inside ./server (except this one) should have access to '../../source';
const shallowSchema = require('shallow-schema');
const database = require('../../source');
const utils = require('../../helpers/utils');
const schema = require('./schema');

function authenticate (user, password, namespace = null) {
    // Namespace User
    if (namespace) {
        const iuser = database.getNamespaceUser(namespace, user);
        if (iuser.ok && iuser.data === utils.sha256(password)) return 1;
    }
    // Database User
    else {
        const iuser = database.getDatabaseUser(user);
        if (iuser.ok && iuser.data === utils.sha256(password)) return 2;
    }

    return 0;

    // Returns an int, according to credential level:
    // Credential Levels:
        // Database User:  2
        // Namespace User: 1
        // Not logged:     0
}

function validateBody (jsondata) {
    return shallowSchema.assertSchema(schema, jsondata);
}

// This function creates a closure:
// every time the resulting function (saveNamespace) is called for a determinate namespace, 
// a debounced function will handle it.
// This means, that, all calls to save a namespace TEST in 300ms will be ignored, except the first, 
// the last, and the ones that are multiples of 10. Thus, saving disk and CPU time by only saving 10% of the requests done concurrently
function queueNamespaceSave () {
    const namespace_debounce_index = new Map();
    return ((ns) => {
        // Here, we define that, operations in a same database in the range of 300ms will be ignored, 
        // and only the first, the last, and the 10th ones will be executed
        // After the 300 ms, the debounced function is deleted, to free memory space 
        if (!namespace_debounce_index.has(ns)) {
            namespace_debounce_index.set(ns, utils.debounce(
                () => database.save(ns), 
                Number(process.env.OPERATION_QUEUE_DURATION || 300), 
                { 
                    leading: true, 
                    trailing: true, 
                    cycle: Number(process.env.OPERATION_QUEUE_CYCLE || 10) 
                },
                () => namespace_debounce_index.delete(ns)
            ));
        };
        namespace_debounce_index.get(ns)()
    });
}
const saveNamespace = queueNamespaceSave();

// This set of functions handle errors in the functions and execute the actions deferred
// to the database handler to prevent the controllers to access the database directly
const queueHandlers = {

    createNamespace: {
        // /nsp/new/<namespace-name>
        requiredAuthLevel: 2,
        exec: (com) => ({ 
            result: database.createNamespace(com.namespace), 
            save: true 
        })
    },

    removeNamespace: {
        // /nsp/del/<namespace-name>
        requiredAuthLevel: 2,
        exec: (com) => ({ 
            result: database.removeNamespace(com.namespace), 
            save: true 
        })
    },

    getAllNamespaces: {
        // /nsp/all
        requiredAuthLevel: 2,
        exec: (com) => ({ 
            result: database.getAllNamespaces()
        })
    },

    createDatabaseUser: {
        // /dbu/new/<user-name>
        // Data: The user password
        requiredAuthLevel: 2,
        exec: (com) => ({
            result: database.createDatabaseUser(com.dbuser, com.data), 
            savecfg: true
        })
    },

    removeDatabaseUser: {
        // /dbu/del/<user-name>
        requiredAuthLevel: 2,
        exec: (com) => ({
            result: database.removeDatabaseUser(com.dbuser),
            savecfg: true
        })
    },

    getDatabaseUser: {
        // /dbu/get/<user-name>
        requiredAuthLevel: 2,
        exec: (com) => ({
            result: database.getDatabaseUser(com.dbuser)
        })
    },

    getAllDatabaseUsers: {
        // /dbu/all
        requiredAuthLevel: 2,
        exec: (com) => ({
            result: database.getAllDatabaseUsers()
        })
    },

    createCollection: {
        // /col/new/<namespace-name>/<collection-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.createCollection(com.namespace, com.collection),
            save: true
        })
    },

    removeCollection: {
        // /col/del/<namespace-name>/<collection-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.removeCollection(com.namespace, com.collection),
            save: true
        })
    },
    
    getAllCollections: {
        // /col/all/<namespace-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.getAllCollections(com.namespace)
        })
    },
    
    createDocument: {
        // /doc/new/<namespace-name>/<collection-name>/<document-name>
        // Data: The document data
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.createDocument(com.namespace, com.collection, com.document, com.data),
            save: true
        })
    },
    
    removeDocument: {
        // /doc/del/<namespace-name>/<collection-name>/<document-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.removeDocument(com.namespace, com.collection, com.document),
            save: true
        })
    },

    getAllDocuments: {
        // /doc/all/<namespace-name>/<collection-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.getAllDocuments(com.namespace, com.collection)
        })
    },
    
    getDocument: {
        // /doc/get/<namespace-name>/<collection-name>/<document-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.getDocument(com.namespace, com.collection, com.document)
        })
    },
    
    createNamespaceUser: {
        // /usr/new/<namespace-name>/<user-name>
        // Data: The user password
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.createNamespaceUser(com.namespace, com.nsuser, com.data),
            save: true
        })
    },

    removeNamespaceUser: {
        // /usr/del/<namespace-name>/<user-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.removeNamespaceUser(com.namespace, com.nsuser),
            save: true
        })
    },
    
    getAllNamespaceUsers: {
        // /usr/all/<namespace-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.getAllNamespaceUsers(com.namespace)
        })
    },

    getNamespaceUser: {
        // /usr/get/<namespace-name>/<user-name>
        requiredAuthLevel: 1,
        exec: (com) => ({
            result: database.getNamespaceUser(com.namespace, com.nsuser)
        })
    }
    
}

// This function is exposed to avoid exposing all the handlers below, 
// it just defers the operation and returns error message if operation is unknown
const queueOperation = (op, components) => {
    const called = queueHandlers[op];
    if (called.requiredAuthLevel === components.authlevel) {
        const { result, save, savecfg } = called.exec(components);
        if (result.ok && save) saveNamespace(components.namespace);
        if (result.ok && savecfg) database.saveConfig();
        return result;
    }
    else {
        return ({ ok: false, error: `Permission Denied: ${op}` });
    }
}

module.exports = {
    authenticate,
    validateBody,
    queueOperation
};