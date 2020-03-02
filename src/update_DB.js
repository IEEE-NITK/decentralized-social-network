async function update_DB(node, orbitdb, new_root_hash) {

    /**
     * To make sure Orbit-DB is fully replicated before user makes changes:
     * https://github.com/orbitdb/orbit-db/blob/master/API.md#replicated
    */
   
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
    // TODO: error handling
    db.put(record)
        .then(() => db.get(myPeerId))
        .then((value) => {
            console.log('The DB has been updated: ')
            console.log(value)
    })

    return true;
}

module.exports.update_DB = update_DB;