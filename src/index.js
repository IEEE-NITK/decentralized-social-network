'use strict'

const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
const Orbit = require('orbit_');
// const multiaddr = require('multiaddr')

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

    const orbit = await initialization.connectToChat(node, Orbit);
    console.log("Connected to orbit-chat");
    
    // Remove this later
    const Root_hash = await node.files.stat('/root_folder');
    console.log('Your root folder hash is: ' + Root_hash.hash)

    // Initialization phase over
    
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
        await utils.addDataToPublicProfile(node, filename, info);

        alert("Public Profile Updated.");

    }

    async function read_public_posts () {

        // Extract the contents of the submission
        var friend_peer_id = document.getElementById("read-public-posts-id").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id)) {
            alert("Please enter all values before submitting.");
            return;
        }

        // TODO: Move to utils

        // THE FOLDER CONTAINING PUBLIC POSTS IS CALLED 'public'

        let file_path = '/ipfs/' + friend_root_hash + '/public/';
        const files = await node.files.ls(file_path);

        files.forEach(async(file) => {

            console.log(file);
            if (file.type == 0) {

                const buf = await node.files.read('/root_folder/public/' + file.name);

                // TODO: add to HTML instead of console.log()
                console.log(buf.toString('utf8'));
            }

        });

        document.getElementById('public-posts-list').style.display = 'block';

    }

    async function create_friend_directory() {

        // Extract the contents of the submission
        var friend_peer_id = document.getElementById("add-friend-id").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id)) {
            alert("Please enter a value before submitting.");
            return;
        }

        // TODO: this should perform search_peer_directory. If it fails, should perform
        // createFriendDirectory() 
        const success = await utils.createFriendDirectory(node, db, friend_peer_id);

        if(success) {
            friend_multiaddr_list.push('/p2p-circuit/ipfs/' + friend_peer_id);
            alert("Friend added.");
        }

        else {
            alert("An error occured. Could not add friend.");
        }

    }
    

    // Search in a peer's directory for your records. Run the create_friend_directory first,
    // so that the peer has been added to your bootstrap list and you are connected to them. 
    async function search_peer_directory() {

        const peer_peerID = document.getElementById('peer_peerID').value;
        await utils.searchPeerDirectory(node, db);
        
    }

    async function write_personal_post() { 

        // Extract the contents of the submission
        var friend_peer_id = document.getElementById("write-friend-post-id").value;
        var friend_post_content = document.getElementById("write-friend-post-content").value;
        var friend_post_filename = document.getElementById("write-friend-post-filename").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id) || !(friend_post_content) || !(friend_post_filename)) {
            alert("Please enter all values before submitting.");
            return;
        }

        // Write the post. TODO: move to utils
        let flag = false;
        const file_path = '/root_folder/' + friend_peer_id + '/personal_post/' + friend_post_filename + '.txt';
        await node.files.write(file_path, encrypted_post, { create: true }).catch((err) => {

            alert('Unable to create personal post to friend!');
            flag = true;

        });
    
        if (flag) {
            return;
        }
    
        // Update root folder hash in the DB
        await utils.updateDB(node, db);

        alert("Personal post has been written");
    }

    async function read_personal_post() {
    
        // Extract the submitted value
        var friend_peer_id = document.getElementById("view-friend-posts-id").value;

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
        const profile = await db.get(peer_peerID)

        if (!(profile && profile.length)) 
        {   
            console.log('Could not find friend\'s details in DB. Cannot add friend!');
            return false;
        }
        
        const rootHash = profile['0']['root_hash']

        const file_path = '/ipfs/' + rootHash + '/' + myPeerId + '/personal_post/';
    
        const files = await node.files.ls(file_path);
    
        files.forEach(async(file) => {

            console.log(file);

            if (file.type == 0) {

                const buf = await node.files.read(file_path + '' + file.name);
                const post = buf.toString('utf8');

                // TODO: add to HTML instead of console.log()
                console.log(post);

            }
    
        });

        // Display the requested friend's posts list
        document.getElementById('friend-posts-list').style.display = 'block';
    }
    
    // Function to write a post into the Group Posts
    async function write_group_post() {
        
        // Extract the contents of the submission
        var group_post_content = document.getElementById("write-friend-post-content").value;
        var group_post_filename = document.getElementById("write-friend-post-filename").value;

        // Ensure the fields weren't empty on submission
        if (!(group_post_content) || !(group_post_filename)) {
            alert("Please enter all values before submitting.");
            return;
        }

        // Place the post in the Group. TODO: Add to utils 
        const file_path = '/root_folder/group/' + group_post_filename;
        const file_added = await node.files.write(file_path, group_post_content, { create: true });

        // Update root folder hash in the DB
        await utils.updateDB(node, db);

        // Write the post
        alert("Group post has been written");

    }

    // Function to read the posts within the Group folder
    async function read_group_post() {

        // Extract the contents of the submission
        var friend_peer_id = document.getElementById("read-group-posts-id").value;

        // Ensure the fields weren't empty on submission
        if (!(friend_peer_id)) {
            alert("Please enter all values before submitting.");
            return;
        }

        // TODO: Move to utils

        // THE FOLDER CONTAINING GROUP POSTS IS CALLED 'group'

        // Use the Group Key to decrypt the contents of the Group Posts
        let file_path = '/ipfs/' + friend_root_hash + '/group/';
        const files = await node.files.ls(file_path);

        files.forEach(async(file) => {

            console.log(file);
            if (file.type == 0) {

                const buf = await node.files.read('/root_folder/group/' + file.name);

                // TODO: add to HTML instead of console.log()
                console.log(buf.toString('utf8'));
            }

        });

        document.getElementById('group-posts-list').style.display = 'block';
    }

    async function open_chat() {

        // TODO: move to utils
        var e = document.getElementById('Chat-Window');

        // Getting our peerID
        const nodeDetails = await Promise.resolve(node.id());
        const myPeerId = nodeDetails.id;

        const username = myPeerId;

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

        });
        
        // SEND A MESSAGE EVERYTIME SEND BUTTON IS CLICKED
        document.getElementById("send-message-btn").onclick = async() => {

            // Extract the contents of the submission
            var channel_message = document.getElementById("chat-message").value;
            
            // Ensure the fields weren't empty on submission
            if (!(channel_message)) {
                alert("Please enter a message!");
                return;
            }

            await orbit.send(channel, channel_message)
            // Send the message and display it on the window
            alert("Message sent");

        }
        
        orbit.connect(username).catch(e => console.error(e));

    }

    // TODO: add to utils
    function display(idToBeDisplayed) {
        document.getElementById('Home').style.display = 'none';
        document.getElementById('Profile').style.display = 'none';
        document.getElementById('Friend-Posts').style.display = 'none';
        document.getElementById('Group-Posts').style.display = 'none';
        document.getElementById('Chat').style.display = 'none';
        document.getElementById('Chat-Body').style.display = 'none';
    
        document.getElementById(idToBeDisplayed).style.display = 'block';
    }

    // Display the Profile Page
    document.getElementById("profile-btn").onclick = () => {

        // Display the requested section
        display("Profile");
    }

    // Display the Friend Posts Page
    document.getElementById("friends-posts-btn").onclick = () => {

        // Display the requested section
        display("Friend-Posts");
    }

    // Display the Group Posts Page
    document.getElementById("group-posts-btn").onclick = () => {

        // Display the requested section
        display("Group-Posts");
    }

    // Display Chat Page
    document.getElementById("start-a-chat-btn").onclick = () => {

        // Display the requested section
        display("Chat");
    }

    document.getElementById("add-friend-btn").onclick = create_friend_directory;
    
    document.getElementById('save-to-profile-btn').onclick = add_data_to_public_profile;
    document.getElementById("read-public-posts-btn").onclick = read_public_posts;

    document.getElementById("write-friend-post-btn").onclick = write_personal_post;
    document.getElementById("view-friend-posts-btn").onclick = read_personal_post;

    document.getElementById("write-group-post-btn").onclick = write_group_post;
    document.getElementById("view-group-posts-btn").onclick = read_group_post;

    // document.getElementById('search_peer_directory').onclick = search_peer_directory;
    document.getElementById('connect-to-channel-btn').onclick = open_chat;

})