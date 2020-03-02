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
    db.put({ 'peerID': myPeerId, public_key: 'test', root_hash: root.hash, multiaddr: '/p2p-circuit/ipfs/' + myPeerId, 
            username: 'krithik' })
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

async function loadFriendsList(node) {

    const files_added = await node.add({ path: '/root_folder/friend_list.txt', content: '1\n2\n3' });
    console.log('Created friends list file: ', files_added[0].path, files_added[0].hash);

    // Getting the hash of our root folder
    const root = await node.files.stat('/root_folder');
    const root_hash = root.hash;
    console.log(root_hash)
    // Full IPFS path of the local friends list file
    const friendsListPath = '/ipfs/' + root_hash + '/friend_list.txt';

    const str = (await node.files.read(friendsListPath)).toString('utf8')
    console.log('as')
    console.log('the str is' + str);
    const friend_list = str.split("\n");
    console.log(friend_list)
    
    return friend_list;
    
}


module.exports.createNode = createNode;
module.exports.createRootFolder = createRootFolder;
module.exports.addDetailsToDB = addDetailsToDB;
module.exports.connectToDB = connectToDB;
module.exports.createDB = createDB;
module.exports.connectToChat = connectToChat;
module.exports.loadFriendsList = loadFriendsList;