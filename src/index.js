'use strict'

const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Orbit = require('orbit_')
const multiaddr = require('multiaddr')

document.addEventListener('DOMContentLoaded', async() => {
    const node = await IPFS.create()
    console.log('IPFS node is ready')
    const orbit = new Orbit(node)
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(node)

    /**
     * Creating the orbit-db database:
     * 
     * const options = {
     *  // Give write access to everyone
     *  accessController: {
     *     write: ['*'],
     *  },
     *  indexBy: 'peerID',
     *  pin: true
     * }
     * 
     * const db = await orbitdb.docs('uqsers_db', options)
     */

    const db = await orbitdb.open('/orbitdb/zdpuB2Gu6EgrD86FzKMYpKbaj8TdH9q4RgyEBKmawBeWtRVXT/users_db1')
    await db.load() // load locally persisted data
    console.log('The address of the orbit-db is: ' + db.address.toString())
    console.log(db.get('c'))
    console.log(db.get(22))
    create_root_folder()
    // const orbit = new Orbit(node) // for orbit-chat

    // let friend_multiaddr_list = []

    async function update_DB(new_root_hash) {

        // Open connection to existing orbitDB database
        const db = await orbitdb.open('/orbitdb/Qmd8TmZrWASypEp4Er9tgWP4kCNQnW4ncSnvjvyHQ3EVSU/first-database')
        await db.load() // load locally persisted data

        console.log('The address of the orbit-db is: ' + db.address.toString())

        // Getting our peerID
        const nodeDetails = await Promise.resolve(node.id())
        const myPeerId = nodeDetails.id

        var record = await db.get(myPeerId)
        record.root_hash = new_root_hash

        // Update the DB.
        db.put(record)
            .then(() => db.get(myPeerId))
            .then((value) => {
                console.log('The DB has been updated: ')
                console.log(value)
            })
    }

    async function create_root_folder() {

        await node.files.mkdir('/root_folder').catch((err) => {
            console.log('Root folder already created!')
        });
        await node.files.mkdir('/root_folder/public_profile').catch((err) => {
            console.log('Public profile already created!')
        });

        console.log('Root folder and public profile created succesfully!')

        // Getting our peerID
        const nodeDetails = await Promise.resolve(node.id())
        const myPeerId = nodeDetails.id
        console.log(myPeerId)

    }

    // async function add_details_to_DB() {
    //     // Getting our peerID
    //     const nodeDetails = await Promise.resolve(node.id())
    //     const myPeerId = nodeDetails.id

    //     // Getting the hash of our root folder
    //     const root = await node.files.stat('/root_folder');
    //     console.log("root_folder hash:");
    //     console.log(root.hash);

    //     /**
    //      * To make sure Orbit-DB is fully replicated before user makes changes:
    //      * https://github.com/orbitdb/orbit-db/blob/master/API.md#replicated
    //      */

    //     /**
    //      * db.events.on('peer', (peer) => ... )
    //      * Emitted when a new peer connects via ipfs pubsub. 
    //      * peer is a string containing the id of the new peer
    //      * https://github.com/orbitdb/orbit-db/blob/master/API.md#peer
    //      */

    //     // Add our data to DB.
    //     db.put({ '_id': 223, 'peerID': myPeerId, public_key: 'test', root_hash: 'test', address: 'IPFS_address', username: 'krithik' })
    //         .then(() => db.get(myPeerId))
    //         .then((value) => console.log(value))
    // }

    async function add_data_to_public_profile() {
        const filename = document.getElementById('profile-filename').value
        const filedata = document.getElementById('profile-info').value

        // const files_added = await node.add({ path: '/root_folder/public_profile/' + filename, content: filedata }).catch((err) => {
        //     console.log('Could not create file')
        //     console.log(err)
        //     return;
        // });
        await node.files.write('/root_folder/public_profile/' + filename, Buffer.from(filedata),{create: true })
        const root = await node.files.stat('/');
        // console.log('Added file:', files_added[0].path, files_added[0].hash)
        // const fileBuffer = await node.cat(files_added[0].hash)

        // console.log('Added file contents:', fileBuffer.toString())

        // Update root folder hash in the DB
        // const root = await node.files.stat('/');
        console.log(root.hash);
        await update_DB(root.hash)
    }

    // async function store() {

    //     const peerInfos = await node.swarm.peers();
    //     console.log(peerInfos);

    //     console.log(db.get('asdasd'))
    //     console.log(db.get(223))

    //     const toStore = document.getElementById('source').value
    //     const result = await node.add(toStore)

    //     for (const file of result) {
    //         if (file && file.hash) {
    //             console.log('successfully stored', file.hash)
    //             await display(file.hash)
    //         }
    //     }
    // }

    // async function display(hash) {
    //     const data = await node.cat(hash)

    //     document.getElementById('hash').innerText = hash
    //     document.getElementById('content').innerText = data
    //     document.getElementById('output').setAttribute('style', 'display: block')
    // }

    // Creation of directory for the given friend and the Hello message.
    async function create_friend_directory() {

        /**
         * Does two things:
         * 1. Adds the IPFS address of the peer to the bootstrap list
         * 2. Creates a folder for the friend and adds the hello message
         */

        // TODO: Improve error handling
        /** 
        const friend_peerID = document.getElementById('friend_peerID').value

        /**
        const profile = await db.get(friend_peerID)
        const friend_address = profile['0']['address']
         */

        let friend_address = document.getElementById('add-friend-id').value;
        friend_address = "/p2p-circuit/ipfs/" + friend_address
        // First add friend to bootstrap list
        const res = await node.bootstrap.add(friend_address) // Check for errors?
        console.log(res.Peers)
	
        const swarm_peers = await node.swarm.peers()
        console.log(swarm_peers)
    }

    // // Search in a peer's directory for your records. Run the create_friend_directory first,
    // // so that the peer has been added to your bootstrap list and you are connected to them.
    // async function search_peer_directory() {

    //     const peer_peerID = document.getElementById('peer_peerID').value

    //     // Getting our peerID
    //     const nodeDetails = await Promise.resolve(node.id());
    //     const myPeerId = nodeDetails.id;

    //     // Querying database for this peer's root folder hash
    //     const profile = await db.get(peer_peerID)
    //     const root_hash = profile['0']['root_hash']

    //     // Full IPFS path of the hello message
    //     const helloMessagePath = '/ipfs/' + root_hash + '/' + myPeerId + '/hello.txt';

    //     // Read the contents of the Hello message, if it exists.
    //     const secretMessage = (await node.files.read(helloMessagePath)).toString('utf8')
    //         .catch((err) => {
    //             console.log('Either\n1. the peer node isn\'t online')
    //             console.log('2. Peer node is online but you are not connected to them')
    //             console.log('3. Peer node has not set up their root folder')
    //             console.log('4. The peer node has not created the directory for you')
    //             return;
    //         });

    //     // The secretMessage should contain the shared-secret encrypted with my public key.
    //     // TODO: decrypt this secret message using my private key. Then store this shared-secret
    //     // in the keystore

    //     console.log(secretMessage);

    //     // Update root folder hash in the DB (currently not needed here)
    //     const root = await node.files.stat('/root_folder');
    //     await update_DB(root.hash)
    // }
    
    async function open_chat() {
        var e = document.getElementById('Chat-Window')
        const username = "ADITYA"
        // Extract the contents of the submission
        var channel = document.getElementById("chat-channel").value;
        // Ensure the fields weren't empty on submission
        if (!(channel)) {
        alert("Please enter all values before submitting.")
        return;
        }
        // Connect to the channel and open the chat window
        display("Chat-Body");
        orbit.events.on('connected', () => {
            console.log(`Connected`)
            orbit.join(channel)
        })

        // After joining the joined message should come
        orbit.events.on('joined', async channelName => {
            
            e.innerHTML += "Joined #" + channelName + "<br>"
            console.log(`-!- Joined #${channelName}`)
        })

        // LISTEN FOR MESSAGES
        orbit.events.on('entry', (entry,channelName) => {
            const post = entry.payload.value
            console.log(`[${post.meta.ts}] &lt;${post.meta.from.name}&gt; ${post.content}`)
            e.innerHTML += (`${post.meta.from.name}: ${post.content}` + "<br>")
          })
        
        // SEND A MESSAGE EVERYTIME SEND BUTTON IS CLICKED
        document.getElementById("send-message-btn").onclick = async() => {

            // Extract the contents of the submission
            var channel_message = document.getElementById("chat-message").value;
            
            // Ensure the fields weren't empty on submission
            if (!(channel_message)) {
                alert("Please enter all values before submitting.")
                return;
            }
            await orbit.send(channel, channel_message)
            // Send the message and display it on the window
            alert("Message sent")
        }
        
        orbit.connect(username).catch(e => console.error(e))
    }

    // Accept, send and display the typed message
    // document.getElementById("send-message-btn").onclick = async(channelName) => {

    //     // Extract the contents of the submission
    //     var channel_message = document.getElementById("chat-message").value;
        
    //     // Ensure the fields weren't empty on submission
    //     if (!(channel_message)) {
    //         alert("Please enter all values before submitting.")
    //         return;
    //     }
    //     await orbit.send(channelName, channel_message)
    //     // Send the message and display it on the window
    //     alert("Message sent")
    // }
    document.getElementById("save-to-profile-btn").onclick = () => {

        // Extract the contents of the submission
        const profile_filename = document.getElementById('profile-filename').value
        const profile_info = document.getElementById('profile-info').value
        if (!(profile_info) || !(profile_filename)) {
            alert("Please enter all fields before submitting.");
            return;
        }
        
        add_data_to_public_profile()
        // Ensure the fields weren't empty on submission
        
    
        // Save the data to public profile
        alert("Public Profile Updated.");
    }    

    function display(idToBeDisplayed) {
        document.getElementById('Home').style.display = 'none';
        document.getElementById('Profile').style.display = 'none';
        document.getElementById('Friend-Posts').style.display = 'none';
        document.getElementById('Group-Posts').style.display = 'none';
        document.getElementById('Chat').style.display = 'none';
        document.getElementById('Chat-Body').style.display = 'none';
    
        document.getElementById(idToBeDisplayed).style.display = 'block';
    }
    
    document.getElementById('add-friend-btn').onclick = create_friend_directory
    // document.getElementById('search_peer_directory').onclick = search_peer_directory
    document.getElementById('connect-to-channel-btn').onclick = open_chat
    
})
