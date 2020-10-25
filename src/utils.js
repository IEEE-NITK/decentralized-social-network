
async function updateDB(node, db) {
    
    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const myPeerId = nodeDetails.id;

    // Get new root folder hash
    const new_root_hash = await node.files.stat('/root_folder');

    const usernamePath = '/root_folder/username.txt';
    let username = (await node.files.read(usernamePath)).toString('utf8');

    let record = await db.get(username);
    record[0].root_hash = new_root_hash.hash;

    console.log('New root folder hash is: ' + new_root_hash.hash);

    // Update the DB.
    db.put(record[0])
    .then(() => db.get(username))
    .then((value) => {
        console.log('The DB has been updated with the new root folder hash');
    });

}


async function addDataToPublicProfile(node, db, filename, filedata) {

    let alert_data = "";
    let flag = false;
    await node.files.write('/root_folder/public_profile/' + filename, Buffer.from(filedata), { create: true }).catch((err) => {
        alert_data = 'Could not create file in public profile! Error: ' + err;
        flag = true;
    });

    if (flag) return alert_data;

    alert_data = 'Added file \"' + filename + '\" to your public profile successfully!';

    // Update root folder hash in DB
    await updateDB(node, db);

    return alert_data;

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
    let alert_data = "";
    const profile = await db.get(friend_peerID)

    if (!(profile && profile.length)) 
    {   
        alert_data = 'Could not find friend\'s details in DB. Cannot add friend!';
        return alert_data;
    }
    
    const friend_address = profile['0']['multiaddr']

    // First add friend to bootstrap list
    await node.bootstrap.add(friend_address)
    console.log('Added friend to bootstrap list!');

    // Next create the folder for the friend and add hello message.
    const directory = '/root_folder/' + friend_peerID;

    let flag = false;
    await node.files.mkdir(directory).catch((err) => {
        console.log("Directory for this friend has already been created!");
        flag = true;
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

    flag = false;
    await node.files.write(file_path, Buffer.from(final_message), { create: true }).catch((err) => {
        alert_data = 'Unable to write hello message to file! Cannot add friend.\nError: ';
        alert_data += err;
        flag = true;
    });

    if (flag) return alert_data;

    // Now add friend multiaddr to our /root_folder/friends_list.txt
    const friendsListPath = '/root_folder/friends_list.txt';

    flag = false;
    await (node.files.read(friendsListPath)).catch((err) => {
        console.log('Creating friends list file...');
        flag = true;
    });

    if (flag) {
        await node.files.write(friendsListPath, "", { create: true }); 
    }

    let str = (await node.files.read(friendsListPath)).toString('utf8');
    str = str + '/p2p-circuit/ipfs/' + friend_peerID + '\n';

    await node.files.rm('/root_folder/friends_list.txt');  // Not reqd
    await node.files.write('/root_folder/friends_list.txt', Buffer.from(str), { create: true });

    alert_data = 'Successfully updated friends list file!';

    // Update root folder hash in the DB
    await updateDB(node, db);
    
    return alert_data;
}

// Search in a peer's directory for your records. Run the create_friend_directory first,
// so that the peer has been added to your bootstrap list and you are connected to them.
async function searchPeerDirectory(node, db, peer_peerID, multiaddr) {

    // Check if the peer is already a friend.
    let peer_address = '/p2p-circuit/ipfs/' + peer_peerID;
    const bootstrap_list = await node.bootstrap.list()
    for (let i = 0; i < bootstrap_list["Peers"].length; i++) {
        let p2p_circuit_addr = bootstrap_list["Peers"][i];
        if (p2p_circuit_addr == peer_address) {
            return "This peer is already your friend!";
        }
    }

    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const myPeerId = nodeDetails.id;

    // Querying database for this peer's root folder hash
    const profile = await db.get(peer_peerID)

    if (!(profile && profile.length)) 
        return 'Could not find friend\'s details in orbit DB. Cannot add friend!';
    

    // First add friend to bootstrap list
    const friend_address = profile['0']['multiaddr'];

    await node.bootstrap.add(friend_address);
    console.log ("Added friend to bootstrap list!");

    // Try to connect to them
    await node.swarm.connect(friend_address);

    const root_hash = profile['0']['root_hash']

    // Full IPFS path of the hello message
    const helloMessagePath = '/ipfs/' + root_hash + '/' + myPeerId + '/hello.txt';

    // Read the contents of the Hello message, if it exists.
    let flag = false;
    let alert_message = "";

    const temp = await node.files.read(helloMessagePath)
        .catch((err) => {
            alert_message = 'Either\n1. The peer node isn\'t online\n';
            alert_message += '2. Peer node is online but you are not connected to them\n';
            alert_message += '3. Peer node has not set up their root folder\n';
            alert_message += '4. The peer node has not created the directory for you\n\n';
            alert_message += 'Could not add this peer as a friend!';
            flag = true;
        });
    
    if (flag) {
        try {
            await node.bootstrap.rm (friend_address);
            console.log ("Removed friend from bootstrap list!");
        }
        catch (err) {

        }
        
        return alert_message;
    }

    const secretMessage = temp.toString('utf8');
    
    // The secretMessage should contain the shared-secret encrypted with my public key.
    // TODO: decrypt this secret message using my private key. Then store this shared-secret
    // in the keystore

    console.log(secretMessage);

    friend_username_list.push(friend_address);

    const friendsListPath = '/root_folder/friends_list.txt';

    flag = false;
    await (node.files.read(friendsListPath)).catch((err) => {
        console.log('Creating friends list file...');
        flag = true;
    });

    if (flag) {
        await node.files.write(friendsListPath, "", { create: true }); 
    }

    let str = (await node.files.read(friendsListPath)).toString('utf8');
    str = str + '' + friend_address + '\n';

    await node.files.rm('/root_folder/friends_list.txt');  // Not reqd
    await node.files.write('/root_folder/friends_list.txt', Buffer.from(str), { create: true });
    
    await updateDB(node, db);

    return "Friend added successfully!";
}

async function writePersonalPost (node, db, friend_peer_username, personal_post_content, personal_post_filename) {

    let profile = await db.get(friend_peer_username);
    let friend_peer_id = profile['0']['_id'];

    await node.files.mkdir('/root_folder/' + friend_peer_id).catch((err) => {

    });

    await node.files.mkdir('/root_folder/' + friend_peer_id + '/personal_post').catch((err) => {

    });

    // Write the post. TODO: move to utils
    let flag = false;
    const file_path = '/root_folder/' + friend_peer_id + '/personal_post/' + personal_post_filename;
    await node.files.write(file_path, Buffer.from(personal_post_content), { create: true }).catch((err) => {

        alert('Unable to create personal post to friend!' + err);
        flag = true;

    });

    if (flag) return;

    // Update root folder hash in the DB
    await updateDB(node, db);

    alert("Personal post to " + friend_peer_username + " has been written!");

}

module.exports.updateDB = updateDB;
module.exports.addDataToPublicProfile = addDataToPublicProfile;
module.exports.createFriendDirectory = createFriendDirectory;
module.exports.searchPeerDirectory = searchPeerDirectory;
module.exports.writePersonalPost = writePersonalPost;