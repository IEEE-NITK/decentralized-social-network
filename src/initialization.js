
async function createNode(IPFS) {

    const node = await IPFS.create(
        { repo: 'ipfs_repository', 
          preload: { enabled: false },
        config: {
            
            
          }});
        
    return node;

}

async function createRootFolder(node) {

    // Creates important files and folders for given node if not already created

    let isCreated = false;

    isCreated = await node.files.mkdir('/root_folder').catch((err) => {
        console.log('Root folder already created!')
        return true;
    });

    if(isCreated)
        return false;

    await node.files.mkdir('/root_folder/public_profile');
    await node.add({ path: '/root_folder/friends_list.txt', content: '' });

    return true;
}

async function addDetailsToDB(node, db, username) {

    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id())
    const myPeerId = nodeDetails.id

    // Getting the hash of our root folder
    const root = await node.files.stat('/root_folder');

    /**
     * To make sure Orbit-DB is fully replicated before user makes changes:
     * https://github.com/orbitdb/orbit-db/blob/master/API.md#replicated
     */

    /**
     * db.events.on('peer', (peer) => ... )
     * Emitted when a new peer connects via ipfs pubsub. 
     * peer is a string containing the id of the new peer
     * https://github.com/orbitdb/orbit-db/blob/master/API.md#peer
     */

    // Add our data to DB.
    await db.put({ '_id': myPeerId, public_key: 'test', root_hash: root.hash, multiaddr: '/p2p-circuit/ipfs/' + myPeerId, username: username })
}

async function connectToDB(node, OrbitDB) {

    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(node);

    const options = {
        // Give write access to everyone
        accessController: {
            write: ['*'],
        },
        indexBy: 'username',
        pin: true
    };

    // Create / Open a database
    const db = await orbitdb.docs("users_db9", options);

    // Load locally persisted data
    await db.load();

    // // Listen for updates from peers
    // db.events.on("replicated", address => {
    //     console.log(db.iterator({ limit: -1 }).collect());
    // });

    /**
     * To make sure Orbit-DB is fully replicated before user makes changes:
     * https://github.com/orbitdb/orbit-db/blob/master/API.md#replicated
    */

    return db;
}

// Create a new Orbit-DB database
async function createDB(node, OrbitDB) {

    // TODO: error handling
    const orbitdb = await OrbitDB.createInstance(node);

    const options = {
        // Give write access to everyone
        accessController: {
            write: ['*'],
        },
        indexBy: 'username',
        pin: true
    };

    const db = await orbitdb.docs('users_db9', options);

    return db;
}

async function connectToChat(node, Orbit) {

    const orbit_chat = new Orbit(node);
    return orbit_chat;

}

async function loadFriendsList(node, isNewProfile) {

    // MFS path of the local friends list file
    const friendsListPath = '/root_folder/friends_list.txt';

    let flag = false;
    await (node.files.read(friendsListPath)).catch((err) => {
        console.log('Creating friends list file...');
        flag = true;
    });

    if (flag) {
        await node.files.write('/root_folder/friends_list.txt', Buffer.from(''), { create: true });
        console.log('Created friends list file');
    }

    let str = (await node.files.read(friendsListPath)).toString('utf8')
    console.log(str)

    let friend_list = str.split("\n");
    
    return friend_list.slice(0, -1);

}


module.exports.createNode = createNode;
module.exports.createRootFolder = createRootFolder;
module.exports.addDetailsToDB = addDetailsToDB;
module.exports.connectToDB = connectToDB;
module.exports.createDB = createDB;
module.exports.connectToChat = connectToChat;
module.exports.loadFriendsList = loadFriendsList;