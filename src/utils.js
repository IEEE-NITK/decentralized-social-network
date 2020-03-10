const mfs = require('ipfs-mfs');

async function updateDB(node, db) {
    
    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const myPeerId = nodeDetails.id;

    // Get new root folder hash
    const new_root_hash = await node.files.stat('/root_folder');

    let record = await db.get(myPeerId);
    record.root_hash = new_root_hash;
    
    // Update the DB.
    db.put(record)
    .then(() => db.get(myPeerId))
    .then((value) => {
        console.log('The DB has been updated with the new root folder hash');
    });

}


async function addDataToPublicProfile(node, db, filename, filedata) {

    const files_added = await node.add({ path: '/root_folder/public_profile/' + filename, content: filedata }).catch((err) => {
        console.log('Could not create file in public profile! Error: ' + err);
        console.log(err);
        return;
    });

    console.log('Added file to your public profile successfully! Hash of file: ', files_added[0].hash);

    // Update root folder hash in DB
    await updateDB(node, db);

}


// Creation of directory for the given friend and the Hello message.
async function createFriendDirectory(node, db, friend_peerID) {

    /**
     * Does two things:
     * 1. Adds the IPFS address of the peer to the bootstrap list
     * 2. Creates a folder for the friend and adds the hello message
     */

    // TODO: Improve error handling

    // Get friend's p2p-circuit address from DB
    const profile = await db.get(friend_peerID)

    if (!(profile && profile.length)) 
    {   
        console.log('Could not find friend\'s details in DB. Cannot add friend!');
        return;
    }
    
    const friend_address = profile['0']['address']

    // First add friend to bootstrap list
    const res = await node.bootstrap.add(friend_address) // Check for errors?
    console.log(res.Peers)

    // Next create the folder for the friend and add hello message.
    const directory = '/root_folder/' + friend_peerID;

    await node.files.mkdir(directory).catch((err) => {
        console.log("Directory for this friend has already been created!");
        return;
    });

    /** TODO: create a shared-secret key, which is then encrypted with the friend's public key.
        Place this final output in the hello_message constant declared below. For now, it is 
        hardcoded to be the friend's peerID.
    */

    // Getting the friend's public key from the DB
    // console.log(profile['0']['public_key']);

    const hello_message = friend_peerID; // Replace peerID with shared-secret

    // TODO: encrypt above with friend's public key that we obtained
    // For now storing unencrypted message
    const final_message = hello_message;
    const file_path = '/root_folder/' + friend_peerID + '/hello.txt';
    const files_added = await node.add({ path: file_path, content: final_message }); // This won't fail,
    // no need to catch err

    console.log('Created Hello message file: ', files_added[0].path, files_added[0].hash)
    const fileBuffer = await node.cat(files_added[0].hash)
    console.log('Contents of Hello message file:', fileBuffer.toString())

    // Update root folder hash in the DB
    await updateDB(node, db);
}

// Search in a peer's directory for your records. Run the create_friend_directory first,
// so that the peer has been added to your bootstrap list and you are connected to them.
async function searchPeerDirectory(node, db) {

    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const myPeerId = nodeDetails.id;

    // Querying database for this peer's root folder hash
    const profile = await db.get(peer_peerID)
    const root_hash = profile['0']['root_hash']

    // Full IPFS path of the hello message
    const helloMessagePath = '/ipfs/' + root_hash + '/' + myPeerId + '/hello.txt';

    // Read the contents of the Hello message, if it exists.
    const secretMessage = (await node.files.read(helloMessagePath)).toString('utf8')
        .catch((err) => {
            console.log('Either\n1. the peer node isn\'t online')
            console.log('2. Peer node is online but you are not connected to them')
            console.log('3. Peer node has not set up their root folder')
            console.log('4. The peer node has not created the directory for you')
            return;
        });

    // The secretMessage should contain the shared-secret encrypted with my public key.
    // TODO: decrypt this secret message using my private key. Then store this shared-secret
    // in the keystore

    console.log(secretMessage);

    // Update root folder hash in the DB (currently not needed here)
    const root = await node.files.stat('/root_folder');
    await updateDB(root.hash)
}


module.exports.updateDB = updateDB;
module.exports.addDataToPublicProfile = addDataToPublicProfile;
module.exports.createFriendDirectory = createFriendDirectory;
module.exports.searchPeerDirectory = searchPeerDirectory;