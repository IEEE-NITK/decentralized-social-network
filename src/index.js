'use strict'

const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
const Orbit = require('orbit_');
const multiaddr = require('multiaddr')

const initialization = require('./initialization');
const utils = require('./utils');

document.addEventListener('DOMContentLoaded', async() => {

    const node = await initialization.createNode(IPFS);
    console.log('IPFS node is ready');

    const isNewProfile = await initialization.createRootFolder(node);
    console.log('Root folder check completed');

    // Friend peer address list stored within root_folder, on a flat file
    let friend_multiaddr_list = await initialization.loadFriendsList(node, isNewProfile);

    const db = await initialization.connectToDB(node, OrbitDB);
    console.log('Successfully connected to orbit-DB at address: ' + db.address.toString());

    if (isNewProfile) {
        
        await initialization.addDetailsToDB(node, db);
        console.log('Added new user record in DB!');

    }

    const orbit_chat = await initialization.connectToChat(node, Orbit);
    console.log("Connected to orbit-chat");
    
    // Remove this later
    const Root_hash = await node.files.stat('/root_folder');
    console.log('Your root folder hash is: ' + Root_hash.hash)

    // Initialization phase over
    
    async function add_data_to_public_profile() {

        const filename = document.getElementById('filename').value;
        const filedata = document.getElementById('filedata').value;
        await utils.addDataToPublicProfile(node, filename, filedata);

    }

    async function create_friend_directory() {

        const friend_peerID = document.getElementById('friend_peerID').value;
        const success = await utils.createFriendDirectory(node, db, friend_peerID);

        if(success) {
            friend_multiaddr_list.push('/p2p-circuit/ipfs/' + friend_peerID);
        }

        // TODO: Remove the below
        const swarm_peers = await node.swarm.peers()
        console.log(swarm_peers)

        /**
        const addr = multiaddr(friend_address)
        await node.swarm.connect(addr)
        */
       
    }
    
    // Search in a peer's directory for your records. Run the create_friend_directory first,
    // so that the peer has been added to your bootstrap list and you are connected to them. 
    async function search_peer_directory() {

        const peer_peerID = document.getElementById('peer_peerID').value;
        await utils.searchPeerDirectory(node, db);
        
    }


    async function open_chat() {

        /** 
         * First, check for online and offline friends. This is done by
         * checking the list of our friend multiaddresses, 
         * and checking if each friend is present in our swarm peers.
         * Ideally should be repeated periodically
         * */

        // Get the swarm peers
        const swarm_peers = await node.swarm.peers()

        /**
         * Two ways of checking for online/offline friends:
         * 1. For each multiaddr in friend_multiaddr_list, loop through
         *    the entire list of swarm peers and check if the multiaddr is present.
         * 2. For each multiaddr in friend_multiaddr_list, swarm connect to 
         *    that address, and check the response. This'll be slower than looping 
         *    through the bootstrap list, which won't usually get larger than hundreds of lines
         */


        let offline_friends = []
        let online_friends = []

        // console.log(swarm_peers['5'].addr.toString())
        for (const friend_multiaddr of friend_multiaddr_list) {
            let flag = 0
            for (const swarm_peer of swarm_peers) {
                console.log(swarm_peer.addr.toString())
                if (swarm_peer['addr']['buffer'].toString() == friend_multiaddr) {
                    online_friends.push(friend_multiaddr)
                    flag = 1
                    break
                }
            }

            if (!flag) {
                offline_friends.push(friend_multiaddr)
            }
        }

        // Display list of online and offline friends
        document.getElementById('offline_friends').innerText = offline_friends
        document.getElementById('online_friends').innerText = online_friends
        document.getElementById('chat').setAttribute('style', 'display: block')

        /** 
        // Joining orbit chat
        const username = 'krithik'
        const channel = 'HelloWorld'

        orbit.events.on('connected', () => {
            console.log('-!- Orbit Chat connected')
            orbit.join(channel)
        })

        orbit.events.on('joined', channelName => {
            orbit.send(channelName, '/me is now caching this channel')
            console.log(`-!- Joined #${channelName}`)
        })

        // Listen for new messages
        orbit.events.on('entry', (entry, channelName) => {
            const post = entry.payload.value
            console.log(`[${post.meta.ts}] &lt;${post.meta.from.name}&gt; ${post.content}`)
        })

        // Connect to Orbit network
        orbit.connect(username).catch(e => console.error(e))
        */
    }

    document.getElementById('data_to_public_profile').onclick = add_data_to_public_profile
    document.getElementById('create_friend_directory').onclick = create_friend_directory
    document.getElementById('search_peer_directory').onclick = search_peer_directory
    document.getElementById('open_chat').onclick = open_chat
})