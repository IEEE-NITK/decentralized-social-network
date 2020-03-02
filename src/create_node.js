async function createNode(IPFS) {

    const node = await IPFS.create();
    return node;

}

module.exports.createNode = createNode