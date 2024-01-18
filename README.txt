
    A document-oriented database approach using VFileSys and namespace isolation:
    
    DATABASE STRUCTURE:
        <database>
            ├────> config
            ├────> <namespace A>
            ├────> <namespace B>
            └────> <namespace C>
        
        The 'config' namespace is used to store the database users and passwords.
        Inside this namespace there is one collection: users.
        And inside the users collection are the documents of the users.
            config
                └────> users
                        └────> user: 'root' ───> password: 'root'
    
    NAMESPACE STRUCTURE:
        <namespace>
            ├────> <collection A>
            │           ├────> <document A> ───> <data A>
            │           ├────> <document B> ───> <data B>
            │           └────> <document C> ───> <data C>
            └────> <collection B>
                        ├────> <document A>
                        ├────> <document B>
                        └────> <document C>

        To edit, remove, configure, insert documents, or any other operation, it 
        is necessary to provide the user and password of the namespace it wants to use.

        Every namespace has an '_auth' collection, preconfigured with this structure:

            <namespace>
                └────> _auth
                        └────> user: 'user' ───> password: 'user'

        The '_auth' collection holds credentials in pairs of user:password.
        This means, every namespace has its own credentials to access them.

        By isolating namespaces like this, a single server can hold multiple 
        namespaces and still no namespace would be aware of the rest.
        Plus, as each namespace has its own credentials for internal edition, 
        the database server owner has no access to edit a namespace, and the 
        namespace owners have no access to the database server itself.

    CHANGING THE DATABASE:

        The database is HTTP(s) only, and this means everything is done via HTTP requests.
        The own database server has credentials of its own, and they are needed to create/remove namespaces.

        Scopes:
            dbu     (the database scope)
            nsp     (the namespace scope)
            col     (the collection scope)
            doc     (the document scope)

        Actions:
            all     (for fetching all units of something)
            get     (for fetching things)
            new     (for creating things)
            del     (for deleting things)

        Credential Levels:
            Database User:  2
            Namespace User: 1
            Not logged:     0

        URL Structure: 
            / scope / action / [ namespace | user ] / [ collection | user ] / document


        Modifications with database server credentials: (credential level: 2)
    
            Creating a namespace:
                Credentials: Database User + Database Password
                Route: GET /nsp/new/<namespace-name>
            
            Deleting a namespace:
                Credentials: Database User + Database Password
                Route: GET /nsp/del/<namespace-name>

            Get all namespace names:
                Credentials: Database User + Database Password
                Route: GET /nsp/all

            Create database user:
                Credentials: Database User + Database Password
                Route: POST /dbu/new/<user-name>
                Data: The user password

            Delete database user:
                Credentials: Database User + Database Password
                Route: GET /dbu/del/<user-name>

            Get database user:
                Credentials: Database User + Database Password
                Route: GET /dbu/get/<user-name>

            Get all database users:
                Credentials: Database User + Database Password
                Route: GET /dbu/all


        Modifications with namespace credentials: (credential level: 1)

            Creating a collection:
                Credentials: Namespace User + Namespace Password
                Route: GET /col/new/<namespace-name>/<collection-name>

            Deleting a collection:
                Credentials: Namespace User + Namespace Password
                Route: GET /col/del/<namespace-name>/<collection-name>

            Get names of all collections:
                Credentials: Namespace User + Namespace Password
                Route: GET /col/all/<namespace-name>

            Creating a document:
                Credentials: Namespace User + Namespace Password
                Route: POST /doc/new/<namespace-name>/<collection-name>/<document-name>
                Data: The document data

            Deleting a document:
                Credentials: Namespace User + Namespace Password
                Route: GET /doc/del/<namespace-name>/<collection-name>/<document-name>

            Get names of all documents:
                Credentials: Namespace User + Namespace Password
                Route: GET /doc/all/<namespace-name>/<collection-name>

            Get a document's data:
                Credentials: Namespace User + Namespace Password
                Route: GET /doc/get/<namespace-name>/<collection-name>/<document-name>

            Creating user:
                Credentials: Namespace User + Namespace Password
                Route: POST /usr/new/<namespace-name>/<user-name>
                Data: The user password
            
            Deleting user:
                Credentials: Namespace User + Namespace Password
                Route: GET /usr/del/<namespace-name>/<user-name>

            Get all namespace users:
                Credentials: Namespace User + Namespace Password
                Route: GET /usr/all/<namespace-name>

            Get namespace user:
                Credentials: Namespace User + Namespace Password
                Route: GET /usr/get/<namespace-name>/<user-name>

            Search for documents:
                // TODO :: IMPLEMENT
