const VirtualFileSystem = require('vfilesys');
const vfs = new VirtualFileSystem();
const path = require('path');
const fs = require('fs');
const utils = require('../helpers/utils');

class DatabaseError extends Error { constructor (msg) { super(msg); }; }

const namespace = {};

namespace.createNamespace = (namespace_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Cannot create existing namespace [${namespace_name}]`);
        try {
            vfs.mkdir(`/db/${namespace_name}`);
            vfs.mkdir(`/db/${namespace_name}/_auth`);
            vfs.write(`/db/${namespace_name}/_auth/user`, utils.sha256('user'));
            return ({ ok: true });
        } catch (err) {
            // Here, we delete the namespace because it would be broken and partially created
            if (vfs.exists(`/db/${namespace_name}`)) vfs.rmdir(`/db/${namespace_name}`);
            throw new DatabaseError(`Failure during namespace creation [${namespace_name}]`);
        }
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.removeNamespace = (namespace_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Cannot remove inexistent namespace [${namespace_name}]`);
        vfs.rmdir(`/db/${namespace_name}`, true);
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getAllNamespaces = () => {
    try {
        return ({ ok: true, data: vfs.readdir('/db', { absolutePaths: false }) });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.createDatabaseUser = (user_name, user_password) => {
    try {
        if (!user_name) throw new DatabaseError(`Invalid user name [${user_name}]`);
        if (!user_password) throw new DatabaseError(`Invalid user password [${user_password}]`);
        vfs.write(`/config/users/${user_name}`, utils.sha256(user_password));
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.removeDatabaseUser = (user_name) => {
    try {
        if (!user_name) throw new DatabaseError(`Invalid user name [${user_name}]`);
        if (user_name === 'root') throw new DatabaseError(`Impossible to remove root user [${user_name}]`);
        if (!vfs.exists(`/config/users/${user_name}`)) throw new DatabaseError(`User does not exist [${user_name}]`);
        vfs.remove(`/config/users/${user_name}`);
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getDatabaseUser = (user_name) => {
    try {
        if (!user_name) throw new DatabaseError(`Invalid user name [${user_name}]`);
        if (!vfs.exists(`/config/users/${user_name}`)) throw new DatabaseError(`User does not exist [${user_name}]`);
        return ({ ok: true, data: vfs.read(`/config/users/${user_name}`, 'utf-8') });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getAllDatabaseUsers = () => {
    try {
        return ({ ok: true, data: vfs.readdir(`/config/users`, { absolutePaths:false }) });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.createCollection = (namespace_name, collection_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!collection_name) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (collection_name == '_auth' || collection_name.startsWith('_')) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (vfs.exists(`/db/${namespace_name}/${collection_name}`)) throw new DatabaseError(`Cannot create existing collection [${collection_name}]`);
        vfs.mkdir(`/db/${namespace_name}/${collection_name}`);
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.removeCollection = (namespace_name, collection_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!collection_name) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (collection_name == '_auth' || collection_name.startsWith('_')) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}`)) throw new DatabaseError(`Inexistent collection [${collection_name}]`);
        vfs.rmdir(`/db/${namespace_name}/${collection_name}`, true);
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getAllCollections = (namespace_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        return ({ ok: true, data: vfs.readdir(`/db/${namespace_name}`, { absolutePaths: false }).filter(v => v !== '_auth') });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.createDocument = (namespace_name, collection_name, document_name, document_data = '') => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!collection_name) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!document_name) throw new DatabaseError(`Invalid document name [${document_name}]`);
        if (collection_name == '_auth' || collection_name.startsWith('_')) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}`)) throw new DatabaseError(`Inexistent collection [${collection_name}]`);
        vfs.write(`/db/${namespace_name}/${collection_name}/${document_name}`, typeof document_data === 'string' ? document_data : JSON.stringify(document_data));
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.removeDocument = (namespace_name, collection_name, document_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!collection_name) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!document_name) throw new DatabaseError(`Invalid document name [${document_name}]`);
        if (collection_name == '_auth' || collection_name.startsWith('_')) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}`)) throw new DatabaseError(`Inexistent collection [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}/${document_name}`)) throw new DatabaseError(`Inexistent document [${document_name}]`);
        vfs.remove(`/db/${namespace_name}/${collection_name}/${document_name}`);
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getAllDocuments = (namespace_name, collection_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!collection_name) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (collection_name == '_auth' || collection_name.startsWith('_')) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}`)) throw new DatabaseError(`Inexistent collection [${collection_name}]`);
        return ({ ok: true, data: vfs.readdir(`/db/${namespace_name}/${collection_name}`, { absolutePaths: false }) });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getDocument = (namespace_name, collection_name, document_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!collection_name) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!document_name) throw new DatabaseError(`Invalid document name [${document_name}]`);
        if (collection_name == '_auth' || collection_name.startsWith('_')) throw new DatabaseError(`Invalid collection name [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}`)) throw new DatabaseError(`Inexistent collection [${collection_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/${collection_name}/${document_name}`)) throw new DatabaseError(`Inexistent document [${document_name}]`);
        return ({ ok: true, data: vfs.read(`/db/${namespace_name}/${collection_name}/${document_name}`, 'utf-8') });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.createNamespaceUser = (namespace_name, user_name, user_password) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!user_name) throw new DatabaseError(`Invalid user name [${user_name}]`);
        if (!user_password) throw new DatabaseError(`Invalid user password [${user_password}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        vfs.write(`/db/${namespace_name}/_auth/${user_name}`, utils.sha256(user_password));
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.removeNamespaceUser = (namespace_name, user_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!user_name) throw new DatabaseError(`Invalid user name [${user_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/_auth/${user_name}`)) throw new DatabaseError(`Inexistent user [${user_name}]`);
        if (namespace.getAllNamespaceUsers(namespace_name).data.length == 1) {
            throw new DatabaseError(`Cannot remove the only user [${user_name}] from namespace [${namespace_name}]`);
        }
        vfs.remove(`/db/${namespace_name}/_auth/${user_name}`);
        return ({ ok: true });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getAllNamespaceUsers = (namespace_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        return ({ ok: true, data: vfs.readdir(`/db/${namespace_name}/_auth`, { absolutePaths: false }) });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.getNamespaceUser = (namespace_name, user_name) => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);
        if (!user_name) throw new DatabaseError(`Invalid user name [${user_name}]`);
        if (!vfs.exists(`/db/${namespace_name}`)) throw new DatabaseError(`Inexistent namespace [${namespace_name}]`);
        if (!vfs.exists(`/db/${namespace_name}/_auth/${user_name}`)) throw new DatabaseError(`Inexistent namespace user [${user_name}]`);
        return ({ ok: true, data: vfs.read(`/db/${namespace_name}/_auth/${user_name}`, 'utf-8') });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

namespace.saveConfig = () => {
    vfs.exportdir(path.join(__dirname, '..', 'storage', 'boot.pop'), `/config`);
    return ({ ok: true, data: 'CFG:/config' });
}

namespace.save = (namespace_name = '*') => {
    try {
        if (!namespace_name) throw new DatabaseError(`Invalid namespace name [${namespace_name}]`);

        if (namespace_name === '*') {
            const nslist = namespace.getAllNamespaces().data;
            for (let n of nslist) {
                vfs.exportdir(path.join(path.resolve(process.env.STORAGE), n), `/db/${n}`);
            }
            return ({ ok: true, data: nslist });
        }

        else {
            // If namespace does not exist, but still exists in savefiles (was deleted)
            if (!vfs.exists(`/db/${namespace_name}`) && fs.existsSync(path.join(path.resolve(process.env.STORAGE), namespace_name))) {
                // remove from real storage
                fs.rmSync(path.join(path.resolve(process.env.STORAGE), namespace_name));
                throw new DatabaseError(`Inexistent namespace [${namespace_name}]`); 
            }
            // If namespace does not exist 
            else if (!vfs.exists(`/db/${namespace_name}`)) {
                throw new DatabaseError(`Inexistent namespace [${namespace_name}]`); 
            }
        }
        
        // if success (namespace exists)
        vfs.exportdir(path.join(path.resolve(process.env.STORAGE), namespace_name), `/db/${namespace_name}`);
        return ({ ok: true, data: namespace_name });
    } catch (err) {
        return ({ ok: false, error: err.message });
    }
}

// Import storage of every namespace at startup
(function bootStorages () {
    
    // Get the location of the external storage (database backup)
    const basepath = path.resolve(process.env.STORAGE);
    // Get the namespace files in external storage
    const storageItems = fs.readdirSync(basepath);

    // Get the config file location
    const configpath = path.resolve(process.env.CONFIG);
    // Build the config file into database first
    vfs.build(configpath);
    // vfs.build(path.join(__dirname, '..', 'storage', 'config.pop'));

    // If this is the first run, there will be no storage items, 
    // and the /db directory may not exist yet
    // And, in POP config files, it is not possible to store empty dirs
    if (!vfs.exists('/db')) vfs.mkdir('/db');

    // Import and build all external storage namespace items
    for (let item of storageItems) {
        vfs.build(path.join(basepath, item));
    }

})();


module.exports = namespace;