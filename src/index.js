'use strict'

const IPFS = require('ipfs')

document.addEventListener('DOMContentLoaded', async() => {
    // const node = await IPFS.create({ repo: String(Math.random() + Date.now()) })
    const node = await IPFS.create()
    console.log('IPFS node is ready')

    async function create_root_folder() {

        await node.files.mkdir('/root_folder').catch((err) => {
            // Do nothing, folder already created
        });
        await node.files.mkdir('/root_folder/public_profile').catch((err) => {
            // Do nothing, folder already created
        });
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
    }

    async function store() {
        const peerInfos = await node.swarm.peers();
        console.log(peerInfos);

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
        // TODO: Improve error handling

        const friend_peerID = document.getElementById('friend_peerID').value

        const directory = '/root_folder/' + friend_peerID;

        await node.files.mkdir(directory).catch((err) => {
            console.log("Directory for this friend has already been created!");
            return;
        });

        /** TODO: create a shared-secret key, which is then encrypted with the friend's public key.
            Place this final output in the hello_message constant declared below. For now, it is 
            hardcoded to be the friend's peerID.
        */

        const hello_message = friend_peerID;
        const file_path = '/root_folder/' + friend_peerID + '/hello.txt';
        const files_added = await node.add({ path: file_path, content: hello_message }); // This won't fail

        console.log('Created Hello message file: ', files_added[0].path, files_added[0].hash)
        const fileBuffer = await node.cat(files_added[0].hash)
        console.log('Contents of Hello message file:', fileBuffer.toString())
    }

    /* const inputElement = document.getElementById("input");
      inputElement.addEventListener("change", handleFiles, false);
      function handleFiles() {
      const fileList = this.files; /* now you can work with the file list 
      console.log(fileList)
      }
    */

    create_root_folder()

    document.getElementById('store').onclick = store
    document.getElementById('data_to_public_profile').onclick = add_data_to_public_profile
    document.getElementById('create_friend_directory').onclick = create_friend_directory
})