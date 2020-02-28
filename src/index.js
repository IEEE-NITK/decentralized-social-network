'use strict'

const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Orbit = require('orbit_')

document.addEventListener('DOMContentLoaded', async() => {
    const node = await IPFS.create()
    console.log('IPFS node is ready')

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

    const friend_address = '/p2p-circuit/ipfs/QmTwBpcZs2GyuA3pGyQxoDTH8HPrCaZzMsw67KhjCLt1My'

    // First add friend to bootstrap list
    const res = await node.bootstrap.add(friend_address) // Check for errors?

    const db = await orbitdb.open('/orbitdb/zdpuB2Gu6EgrD86FzKMYpKbaj8TdH9q4RgyEBKmawBeWtRVXT/users_db1')
    await db.load() // load locally persisted data
    console.log('The address of the orbit-db is: ' + db.address.toString())
    console.log(db.get('c'))
    console.log(db.get(22))

    const orbit = new Orbit(node) // for orbit-chat

    let friend_multiaddr_list = []

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

    async function add_details_to_DB() {
        // Getting our peerID
        const nodeDetails = await Promise.resolve(node.id())
        const myPeerId = nodeDetails.id

        // Getting the hash of our root folder
        const root = await node.files.stat('/root_folder');
        console.log("root_folder hash:");
        console.log(root.hash);

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
        db.put({ '_id': 223, 'peerID': myPeerId, public_key: 'test', root_hash: 'test', address: 'IPFS_address', username: 'krithik' })
            .then(() => db.get(myPeerId))
            .then((value) => console.log(value))
    }

    async function add_data_to_public_profile() {
        const filename = document.getElementById('filename').value
        const filedata = document.getElementById('filedata').value

        const files_added = await node.add({ path: '/root_folder/public_profile/' + filename, content: filedata }).catch((err) => {
            console.log('Could not create file')
            console.log(err)
            return;
        });

        console.log('Added file:', files_added[0].path, files_added[0].hash)
        const fileBuffer = await node.cat(files_added[0].hash)
        console.log('Added file contents:', fileBuffer.toString())

        // Update root folder hash in the DB
        const root = await node.files.stat('/root_folder');
        await update_DB(root.hash)
    }

    async function store() {


        const peerInfos = await node.swarm.addrs();
        console.log(peerInfos);

        console.log(db.get('asdasd'))
        console.log(db.get(223))

        const toStore = document.getElementById('source').value
        const result = await node.add(toStore)

        for (const file of result) {
            if (file && file.hash) {
                console.log('successfully stored', file.hash)
                await display(file.hash)
            }
        }
    }

    async function display(hash) {
        const data = await node.cat(hash)

        document.getElementById('hash').innerText = hash
        document.getElementById('content').innerText = data
        document.getElementById('output').setAttribute('style', 'display: block')
    }

    // Creation of directory for the given friend and the Hello message.
    async function create_friend_directory() {

        /**
         * Does two things:
         * 1. Adds the IPFS address of the peer to the bootstrap list
         * 2. Creates a folder for the friend and adds the hello message
         */

        // TODO: Improve error handling

        const friend_peerID = document.getElementById('friend_peerID').value

        /**
        const profile = await db.get(friend_peerID)
        const friend_address = profile['0']['address']
         */

        const friend_address = '/p2p-circuit/ipfs/QmXqXZKMC5J6um1q8mQXuRB2L83FdFdr2MJEhbd4UDAdkG'

        // First add friend to bootstrap list
        const res = await node.bootstrap.add(friend_address) // Check for errors?
        console.log(res.Peers)

        // Also store the friend's multiaddr
        friend_multiaddr_list.push(friend_address)

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
        // console.log(profile['0']['public_key'])  // prints friend's public key

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

        // Open connection to existing orbitDB database
        const db = await orbitdb.open('/orbitdb/Qmd8TmZrWASypEp4Er9tgWP4kCNQnW4ncSnvjvyHQ3EVSU/first-database')
        await db.load() // load locally persisted data

        console.log('The address of the orbit-db is: ' + db.address.toString())

        const profile = await db.get('QmXqXZKMC5J6um1q8mQXuRB2L83FdFdr2MJEhbd4UDAdkG')
        console.log(profile)

        // Update root folder hash in the DB
        const root = await node.files.stat('/root_folder');
        await update_DB(root.hash)
    }

    // Search in a peer's directory for your records. Run the create_friend_directory first,
    // so that the peer has been added to your bootstrap list and you are connected to them.
    async function search_peer_directory() {

        const peer_peerID = document.getElementById('peer_peerID').value

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
        await update_DB(root.hash)
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

        console.log(swarm_peers['5'].addr.toString())
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

    document.getElementById('create_root_folder').onclick = create_root_folder
    document.getElementById('add_details_to_DB').onclick = add_details_to_DB
    document.getElementById('store').onclick = store
    document.getElementById('data_to_public_profile').onclick = add_data_to_public_profile
    document.getElementById('create_friend_directory').onclick = create_friend_directory
    document.getElementById('search_peer_directory').onclick = search_peer_directory
    document.getElementById('open_chat').onclick = open_chat
})