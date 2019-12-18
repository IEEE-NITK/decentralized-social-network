const IPFS = require('ipfs')

async function setupfolders () {
    const node = await IPFS.create()
    //CREATING A ROOT FOLDER 
    await node.files.mkdir('/root_folder');
    //CREATING A PUBLIC PROFILE FOLDER
    await node.files.mkdir('/root_folder/public_profile');

    //CONTENTS IN PUBLIC PROFILE IS UNENCRYPTED 
    //TESTING BY ADDING SOME DATA TO PUBLIC PROFILE
    //***************************************//
    const files_added = await node.add({path: '/root_folder/public_profile/about_me.txt', content: 'I AM MOHAN DAS, I LOVE SWIMMING!'});

    console.log('Added file:', files_added[0].path, files_added[0].hash)
    const fileBuffer = await node.cat(files_added[0].hash)
    console.log('Added file contents:', fileBuffer.toString())
    //***************************************//


    //HASH OF THE ROOT 
    const root  = await node.files.stat('/root_folder')
    console.log("root_folder hash:")
    console.log(root.hash)

    // UPDATION OF ROOT HASH TO HAPPEN IN DATABSE HERE { FUNCTION NEEDED  }

    //HASH OF THE PUBLIC PROFILE
    const public_profile  = await node.files.stat('/root_folder/public_profile')
    console.log("public_profile:")
    console.log(public_profile.hash)
}

// Creation of directory for the given friend and the Hello message.
async function create_friend_directory (friend_peerID) {
   
   const node = await IPFS.create();

   const directory = '/root_folder/' + friend_peerID;
   await node.files.mkdir(directory);

   /** TODO: create a shared-secret key, which is then encrypted with the friend's public key.
       Place this final output in the hello_message constant declared below. For now, it is 
       hardcoded to be the friend's peerID.
   */

   const hello_message = friend_peerID;
   const file_path = '/root_folder/' + friend_peerID + '/hello.txt'; 

   const files_added = await node.add({path: file_path, content: hello_message});

   console.log('Created Hello message file: ', files_added[0].path, files_added[0].hash)
   const fileBuffer = await node.cat(files_added[0].hash)
   console.log('Contents of Hello message file:', fileBuffer.toString())
} 


// Searching for for a Hello message created for us in given node's root folder, and getting the shared-secret.
async function search_peer_directory (friend_hash) {

   const node = await IPFS.create();

   // Getting our peerID
   const nodeDetails = await Promise.resolve(node.id());
   const myPeerId = nodeDetails.id;
   
   // TODO: Query database for root_folder has for given friend_hash (received as function parameter)
   // and store it in rootHash. Hardcoded for now.
   const rootHash = 'QmYbR8Ery48YbJpJbU18rBRmdjZMmPih9YktKPhrwnRLa4';
   const helloMessagePath = '/ipfs/' + rootHash + '/' + myPeerId + '/hello.txt';

   // Read the contents of the Hello message, if it exists.
   const secretMessage = (await node.files.read(helloMessagePath)).toString('utf8');

   /** At this point there are two possibilities:
       1. If the Hello message exists in their folder, the function continues execution.
       2. If the Hello message does not exist, and UnhandledPromiseRejectionWarning is raised.
          This is caught in the function call statement.
   */
   
   // The secretMessage should contain the shared-secret encrpyted with my public key.
   // TODO: decrypt this secret message using my private key.

   console.log(secretMessage);
}


// Run this to setup folders.
// setupfolders();



/**  Run this to create the directory for the given friend and the Hello message.
     The function takes in the friend's peerID as parameter.
*/
// create_friend_directory("QmTNuULgQPpZceebSr15XYFXwRZK7JYF1jjqhHzkGs1nvp");



/** Run this to search for a Hello message created for you in a peer node's directory.
    Takes in the peer's peerID as parameter.
*/
/**
search_peer_directory('QmTNuULgQPpZceebSr15XYFXwRZK7JYF1jjqhHzkGs1nvp').catch(() => {
   console.log('File Not Found');
});
*/