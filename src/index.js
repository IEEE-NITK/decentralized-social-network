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

    const usernamePath = '/root_folder/username.txt';

    let username = "";
    await node.files.read(usernamePath).catch(async (err) => {
        username = prompt("Please enter a username (will be used in the chat)", "Username");
        await node.files.write(usernamePath, Buffer.from(username), { create: true }).catch((err) => {});
    });

    username = (await node.files.read(usernamePath)).toString('utf8');

    // const res = await node.bootstrap.list()
    // console.log(res.Peers)

    // Friend peer address list stored within root_folder, on a flat file
    let friend_multiaddr_list = await initialization.loadFriendsList(node, isNewProfile);

    const db = await initialization.connectToDB(node, OrbitDB);
    console.log('Successfully connected to orbit-DB at address: ' + db.address.toString());

    await initialization.addDetailsToDB(node, db, username);
    console.log('Added new user record in DB!');

    const orbit = await initialization.connectToChat(node, Orbit);
    console.log("Connected to orbit-chat");
    
    // Remove this later
    const Root_hash = await node.files.stat('/root_folder');
    console.log('Your root folder hash is: ' + Root_hash.hash)

    // Initialize orbit chat. Connect to the orbit chat network.
   
    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const my_peer_id = nodeDetails.id;

    const orbit_username = username;
    let channel = "";
    var e = document.getElementById('Chat-Window');

    orbit.events.on('connected', () => {
        console.log('Connected/Reconnected to orbit-chat network!');
    });

    // After joining the joined message should come
    orbit.events.on('joined', async channelName => {
            
        e.innerHTML += ">  Joined #" + channelName + "<br>"
        console.log(`-!- Joined #${channelName}`)
    });
    
    // LISTEN FOR MESSAGES
    orbit.events.on('entry', (entry,channelName) => {

        const post = entry.payload.value
        console.log(`[${post.meta.ts}] &lt;${post.meta.from.name}&gt; ${post.content}`)
        e.innerHTML += ("> " + `${post.meta.from.name}: ${post.content}` + "<br>")

    });
    
    // SEND A MESSAGE EVERYTIME SEND BUTTON IS CLICKED
    window.SendMessage = async function () {

        // Extract the contents of the submission
        var channel_message = document.getElementById("chat-message").value;
        
        // Ensure the fields weren't empty on submission
        if (!(channel_message)) {
            alert("Please enter a message!");
            return;
        }

        await orbit.send(channel, channel_message);

        return false;
    };

    document.getElementById("disconnect-btn").onclick = async() => {

        try {
            await orbit.leave();
            await orbit.disconnect();
            await orbit.connect(orbit_username).catch(e => console.error(e));
            alert ("Disconnected");
            display("Chat");

        }
        catch(err) {
            alert (err);
        }
    };

    orbit.connect(orbit_username).catch(e => console.error(e));

    document.getElementById('peer-id').innerText = my_peer_id;

    // Initialization phase over

    // const res = await ipfs.bootstrap.rm(null, { all: true })
    // console.log(res.Peers)
    
    async function add_data_to_public_profile() {

        // Extract the contents of the submission
        const filename = document.getElementById('profile-filename').value
        const info = document.getElementById('profile-info').value

        // Ensure the fields weren't empty on submission
        if (!(info) || !(filename)) {
            alert("Please enter all fields before submitting.");
            return;
        }
    
        // Save the data to public profile
        let alert_data = await utils.addDataToPublicProfile(node, db, filename, info);
        alert (alert_data);

    }

    async function read_public_posts () {

        // Extract the contents of the submission
        var peer_peerID = document.getElementById("read-public-posts-id").value;

        // Querying database for this peer's root folder hash
        const profile = await db.get(peer_peerID)

        if (!(profile && profile.length)) 
        {   
            console.log('Could not find peer\'s details in orbit DB. Cannot read peer\'s public posts!');
            return false;
        }

        // TODO: Move to utils

        // THE FOLDER CONTAINING PUBLIC POSTS IS CALLED 'public_profile'

        let file_path = '/ipfs/' + profile[0].root_hash + '/public_profile/';
        const files = await node.files.ls(file_path);

        files.forEach(async(file) => {

            console.log(file);
            if (file.type == 0) {

                const buf = await node.files.read('/root_folder/public_profile/' + file.name);

                // TODO: add to HTML instead of console.log()
                console.log(buf.toString('utf8'));
            }

        });

        document.getElementById('public-posts-list').style.display = 'block';

    }

    async function create_friend_directory() {

        // Extract the contents of the submission
        var friend_peer_id = document.getElementById("create-friend-directory-peer-id").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id)) {
            alert("Please enter a value before submitting.");
            return;
        }

        let friend_address = '/p2p-circuit/ipfs/' + friend_peer_id;

        // First add friend to bootstrap list and attempt to connect to them.
        await node.bootstrap.add(friend_address)
        console.log('Added friend to bootstrap list!');

        try {
            await node.swarm.connect(friend_address);
        }
        catch (err) {

        }

        // TODO: this should perform search_peer_directory. If it fails, should perform
        // createFriendDirectory() 
        const success = await utils.createFriendDirectory(node, db, friend_peer_id);

        if(success) {

            let new_friend = '/p2p-circuit/ipfs/' + friend_peer_id;
            friend_multiaddr_list.push(new_friend);

            const friendsListPath = '/root_folder/friends_list.txt';

            let flag = false;
            await (node.files.read(friendsListPath)).catch((err) => {
                console.log('Creating friends list file...');
                flag = true;
            });

            if (flag) {
                await node.files.write(friendsListPath, "", { create: true }); 
            }

            let str = (await node.files.read(friendsListPath)).toString('utf8');
            str = str + '/p2p-circuit/ipfs/' + friend_peer_id + '\n';

            await node.files.rm('/root_folder/friends_list.txt');  // Not reqd
            await node.files.write('/root_folder/friends_list.txt', Buffer.from(str), { create: true });

            // Update root folder hash in the DB
            await utils.updateDB(node, db);
            alert("Directory for peer " + friend_peer_id + " created!");
        }

        else {
            alert("An error occured. Could not create directory for peer" + friend_peer_id);
        }

    }
    

    // Search in a peer's directory for your records. Run the create_friend_directory first,
    // so that the peer has been added to your bootstrap list and you are connected to them. 
    async function search_peer_directory() {

        const peer_peerID = document.getElementById('peer_peerID').value;
        let alert_value = await utils.searchPeerDirectory(node, db, peer_peerID, multiaddr);
        alert (alert_value);
    }

    async function write_personal_post() { 

        // Extract the contents of the submission
        var friend_peer_id = document.getElementById("write-personal-post-id").value;
        var personal_post_content = document.getElementById("write-personal-post-content").value;
        var personal_post_filename = document.getElementById("write-personal-post-filename").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id) || !(personal_post_content) || !(personal_post_filename)) {
            alert("Please enter all values before submitting.");
            return;
        }
 
        await utils.writePersonalPost(node, db, friend_peer_id, personal_post_content, personal_post_filename);
    }

    async function read_personal_post(peerid) {
    
        // Extract the submitted value
        var friend_peer_id = peerid;

        // Ensure the form wasn't empty on submission
        if (!(friend_peer_id)) {
            alert("Please enter a value before submitting.");
            return;
        }

        // Getting our peerID
        const nodeDetails = await Promise.resolve(node.id());
        const myPeerId = nodeDetails.id;
    
        // TODO: Move to utils
        
        // Querying database for this peer's root folder hash
        const profile = await db.get(friend_peer_id)

        if (!(profile && profile.length)) 
        {   
            console.log('Could not find friend\'s details in DB. Cannot read posts!');
            return false;
        }
        
        const rootHash = profile['0']['root_hash']

        const file_path = '/ipfs/' + rootHash + '/' + myPeerId + '/personal_post/';
        
        return file_path;
       
    }
    
    // Function to write a post into the Posts for friends
    async function write_friend_post() {
        
        // Extract the contents of the submission
        var friend_post_content = document.getElementById("write-friend-post-content").value;
        var friend_post_filename = document.getElementById("write-friend-post-filename").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_post_content) || !(friend_post_filename)) {
            alert("Please enter all values before submitting.");
            return;
        }

        // Place the post in the friend folder. TODO: Add to utils 

        await node.files.mkdir('/root_folder/friend/').catch((err) => {
            // console.log('friend folder already created!')
        });

        const file_path = '/root_folder/friend/' + friend_post_filename;
        await node.files.write(file_path, Buffer.from(friend_post_content), { create: true }).catch((err) => {

            alert('Unable to create friend post!' + err);
    
        });

        // Update root folder hash in the DB
        await utils.updateDB(node, db);

        // Write the post
        alert("Friend post has been written!");

    }

    // Function to read the posts within the friend folder of a peerid
    async function read_friend_post(peerid) {

        // Extract the contents of the submission
        var friend_peer_id = peerid;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id)) {
            alert("Please enter all values before submitting.");
            return;
        }

        // TODO: Move to utils

        // THE FOLDER CONTAINING FRIEND POSTS IS CALLED 'friend'

        // TODO: Use the friends Key to decrypt the contents of the friend Posts

        // Querying database for this peer's root folder hash
        const profile = await db.get(friend_peer_id)

        if (!(profile && profile.length))
            return null;

        let file_path = '/ipfs/' + profile[0].root_hash + '/friend/';
        
        return file_path;
        // files.forEach(async(file) => {

        //     console.log(file);
        //     if (file.type == 0) {

        //         const buf = await node.files.read('/root_folder/friend/' + file.name);

        //         // TODO: add to HTML instead of console.log()
        //         console.log(buf.toString('utf8'));
        //     }

        // });

        // document.getElementById('friend-posts-list').style.display = 'block';
    }

    async function open_chat(channel_name) {

        // Extract the contents of the submission
        channel = channel_name;
        console.log (channel_name);
        
        // Ensure the fields weren't empty on submission
        if (!(channel)) {
            alert("Please enter all values before submitting.")
            return;
        }

        // Connect to the channel and open the chat window

        await orbit.join(channel);
        display("Chat-Body");

        // orbit.events.on('connected', () => {
        
        // });

    }

    // TODO: add to utils
    function display(idToBeDisplayed) {
        document.getElementById('Home').style.display = 'none';
        document.getElementById('Profile').style.display = 'none';
        document.getElementById('Personal-Posts').style.display = 'none';
        document.getElementById('Friend-Posts').style.display = 'none';
        document.getElementById('Chat').style.display = 'none';
        document.getElementById('Chat-Body').style.display = 'none';
        document.getElementById('Wall-Posts').style.display = 'none';
        // document.getElementById('Online-Offline-Friends').style.display = 'none';
    
        document.getElementById(idToBeDisplayed).style.display = 'block';
    }

    // Display the Home Page
    document.getElementById("home-btn").onclick = () => {

        // Display the requested section
        display("Home");
    }

    async function display_wall_posts ()
    {

        var e = document.getElementById('Friends');
        friend_multiaddr_list = ['/p2p-circuit/ipfs/QmXTfW8Cd7P29mJ2VQr5JKkRbsjTrHM4sPzLnQVnMJhxTY', '/p2p-circuit/ipfs/QmXTfW8Cd7P29mJ2VQr5JKkRbsjTrHM4sPzLnQVnMJhxTY'];
        for (const friend_multiaddr of friend_multiaddr_list) {

            let friend_peerid = friend_multiaddr.split('/')[3];

            const file_path = await read_friend_post (friend_peerid);

            if (!(file_path && file_path.length))
            {
                console.log ("No friend posts found for the given peer!");
                continue;
            }

            const files = await node.files.ls(file_path);
            
            e.innerHTML += "<h4> Friend posts made by " + friend_multiaddr.split('/')[3] + " <h4><br>";

            await files.forEach(async(file) => {
                
                if (file.type == 0) {
                    
                    const buf = await node.files.read(file_path + '' + file.name);
                    e.innerHTML += ``
                    
                    var post = buf.toString('utf8');
                    console.log(post);
                    e.innerHTML += ('<div style = "border:solid 2px"><h5>' + file.name + ': ' + post + '</h5></div><br>');
                }
    
            });
            
        }

    }

    //Display the wall
    document.getElementById("wall-btn").onclick = () => {

        // Display the requested section
        // generate_wall(); will 
        display("Wall-Posts");
        display_wall_posts ();
    }

    // Display the Profile Page
    document.getElementById("profile-btn").onclick = async () => {

        // Display the requested section
        display("Profile");
    }

    // Display the Friend Posts Page
    document.getElementById("personal-posts-btn").onclick = () => {

        // Display the requested section
        display("Personal-Posts");
    }

    // Display the Friend Posts Page
    document.getElementById("friend-posts-btn").onclick = () => {

        // Display the requested section
        display("Friend-Posts");
    }

    async function display_online_offline_friends () {
        /** 
         * First, check for online and offline friends. This is done by
         * checking the list of our friend multiaddresses, 
         * and checking if each friend is present in our swarm peers.
         * Ideally should be repeated periodically
         * */
       
        // Get the swarm peers
        const swarm_peers = await node.swarm.peers();

        /**
         * Two ways of checking for online/offline friends:
         * 1. For each multiaddr in friend_multiaddr_list, loop through
         *    the entire list of swarm peers and check if the multiaddr is present.
         * 2. For each multiaddr in friend_multiaddr_list, swarm connect to 
         *    that address, and check the response. This'll be slower than looping 
         *    through the bootstrap list, which won't usually get larger than hundreds of lines
         */


        let offline_friends = "";
        let online_friends = "";

        // console.log(swarm_peers['5'].addr.toString())
        for (const friend_multiaddr of friend_multiaddr_list) {
            let flag = 0;
            let friend_uname = "";

            try {
                let test = await db.get(friend_multiaddr.split('/')[3]);
                friend_uname = test['0']['username'];
            }
            catch (err) {
                friend_uname = friend_multiaddr;
            }

            for (const swarm_peer of swarm_peers) {
                
                if (swarm_peer['addr']['buffer'].toString() == friend_multiaddr) {
                    online_friends = online_friends.concat('<a href=\"\" onclick=\"return OpenChat(\'' + friend_multiaddr + '\');\">', friend_uname, "</a><br>");
                    flag = 1;
                    break;
                }

            }

            if (flag == 0) {
                offline_friends = offline_friends.concat(friend_multiaddr, '<br>');
            }
        }

        // Display list of online and offline friends
        document.getElementById('offline_friends').innerHTML = offline_friends;
        document.getElementById('online_friends').innerHTML = online_friends;

    }

    // Display Chat Page
    document.getElementById("start-a-chat-btn").onclick = () => {
        
        display_online_offline_friends ();

        // Display the requested section
        display("Chat");
    }
    function open_chat_prep()
    {
        var typed_channel = document.getElementById("chat-channel").value;
        
        open_chat(typed_channel);
    }
    
    async function read_friend_post_prep()
    {
        var peerid = document.getElementById("read-friend-posts-id").value;

        var flag = false;
        for (const friend_multiaddr of friend_multiaddr_list) {
            if (friend_multiaddr.split('/')[3] == peerid) {
                flag = true;
                break;
            }
        }

        if (flag == false)
        {
            alert ("That peer is not your friend!");
            return false;
        }

        const file_path = await read_friend_post(peerid);

        if (!(file_path && file_path.length))
        {
            alert ("No friend posts found for the given peer!");
            return false;
        }

        const files = await node.files.ls(file_path);
        console.log(files);
        var e = document.getElementById('friend-posts-list')
        e.innerHTML = "<h3> POSTS <h3>";
        files.forEach(async(file) => {

            console.log(file);
            
            if (file.type == 0) {

                const buf = await node.files.read(file_path + '' + file.name);
                e.innerHTML += ``
                
                // TODO: add to HTML instead of console.log()
                var post = buf.toString('utf8');
                console.log(post);
                e.innerHTML += ('<div style = "border:solid 2px"><h3>' + file.name + ':' + post + '</h3></div>');
            }

        });

        document.getElementById('friend-posts-list').style.display = 'block';

    }

    async function read_personal_post_prep()
    {
        
        var peerid = document.getElementById("view-personal-posts-id").value;
        const file_path = await read_personal_post(peerid);
        var e = document.getElementById('personal-posts-list');
        e.innerHTML = "<h3> POSTS <h3>";

        const files = await node.files.ls(file_path);
    
        files.forEach(async(file) => {

            console.log(file);

            if (file.type == 0) {

                const buf = await node.files.read(file_path + '' + file.name);
                const post = buf.toString('utf8');

                // TODO: add to HTML instead of console.log()
                console.log(post);
                e.innerHTML += ('<div style = "border:solid 2px"><h3>' + file.name + ':' + post + '</h3></div>');
            }
    
        });

        // Display the requested friend's posts list
        document.getElementById('personal-posts-list').style.display = 'block';
    }


    document.getElementById("create-friend-directory-btn").onclick = create_friend_directory;
    document.getElementById("search-peer-directory-btn").onclick = search_peer_directory;

    document.getElementById('save-to-profile-btn').onclick = add_data_to_public_profile;
    document.getElementById("read-public-posts-btn").onclick = read_public_posts;

    document.getElementById("write-personal-post-btn").onclick = write_personal_post;
    document.getElementById("view-personal-posts-btn").onclick = read_personal_post_prep;

    document.getElementById("write-friend-post-btn").onclick = write_friend_post;
    document.getElementById("view-friend-posts-btn").onclick = read_friend_post_prep;

    document.getElementById('connect-to-channel-btn').onclick = open_chat_prep;

    window.OpenChat = function(multiaddr) {

        let peer_peer_id = multiaddr.split('/')[3];

        if (my_peer_id < peer_peer_id)
            open_chat (my_peer_id + '' + peer_peer_id);
        else
            open_chat (peer_peer_id + '' + my_peer_id);

        return false;
    };

    document.getElementById("page").style.display = "block";
    document.getElementById("loading").style.display = "none";

})