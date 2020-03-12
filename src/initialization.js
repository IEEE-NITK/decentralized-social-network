const mfs = require('ipfs-mfs');

async function createNode(IPFS) {

    const node = await IPFS.create({ repo: 'ipfs_repository' });
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

async function addDetailsToDB(node, db) {

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
    db.put({ '_id': myPeerId, public_key: 'test', root_hash: root.hash, multiaddr: '/p2p-circuit/ipfs/' + myPeerId })
}

async function connectToDB(node, OrbitDB) {

    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(node);

    // Connect to the previously created users_db1
    const db = await orbitdb.open('/orbitdb/zdpuB2Gu6EgrD86FzKMYpKbaj8TdH9q4RgyEBKmawBeWtRVXT/users_db1');
    // Load locally persisted data
    await db.load();

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
        indexBy: 'peerID',
        pin: true
    };

    const db = await orbitdb.docs('users_db', options);

    return db;
}

async function connectToChat(node, Orbit) {

    const orbit_chat = new Orbit(node);
    return orbit_chat;

}

async function loadFriendsList(node, isNewProfile) {

    if(isNewProfile)
    {
        const files_added = await node.files.write('/root_folder/friends_list.txt', Buffer.from(''), { create: true })
        console.log('Created friends list file');
    }

    // MFS path of the local friends list file
    const friendsListPath = '/root_folder/friends_list.txt';

    const str = (await node.files.read(friendsListPath)).toString('utf8')
    console.log(str)

    const friend_list = str.split("\n");
    
    return friend_list;

}


module.exports.createNode = createNode;
module.exports.createRootFolder = createRootFolder;
module.exports.addDetailsToDB = addDetailsToDB;
module.exports.connectToDB = connectToDB;
module.exports.createDB = createDB;
module.exports.connectToChat = connectToChat;
module.exports.loadFriendsList = loadFriendsList;