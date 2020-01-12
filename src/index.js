'use strict'

const IPFS = require('ipfs')

document.addEventListener('DOMContentLoaded', async () => {
  // const node = await IPFS.create({ repo: String(Math.random() + Date.now()) })
  const node = await IPFS.create()
  console.log('IPFS node is ready')

  async function create_root_folder () {
    
    await node.files.mkdir('/root_folder');
    await node.files.mkdir('/root_folder/public_profile');

    // CONTENTS IN PUBLIC PROFILE IS UNENCRYPTED 
    // TESTING BY ADDING SOME DATA TO PUBLIC PROFILE
    const files_added = await node.add({path: '/root_folder/public_profile/about_me.txt', content: 'I AM MOHAN DAS, I LOVE SWIMMING!'});

    console.log('Added file:', files_added[0].path, files_added[0].hash)
    const fileBuffer = await node.cat(files_added[0].hash)
    console.log('Added file contents:', fileBuffer.toString())
  }

  async function store () {
    const toStore = document.getElementById('source').value
    const result = await node.add(toStore)

    for (const file of result) {
      if (file && file.hash) {
        console.log('successfully stored', file.hash)
        await display(file.hash)
      }
    }
  }

  async function display (hash) {
    const data = await node.cat(hash)

    document.getElementById('hash').innerText = hash
    document.getElementById('content').innerText = data
    document.getElementById('output').setAttribute('style', 'display: block')
  }

  // create_root_folder()
  document.getElementById('store').onclick = store

  const inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);
    function handleFiles() {
    const fileList = this.files; /* now you can work with the file list */
    console.log(fileList)
  }
})