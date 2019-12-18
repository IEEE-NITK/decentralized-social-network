
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
    const files_added = await node.add({path: '/root_folder/public_profile/about_me.txt', content: 'I AM MOHAN DAS, I LOVE SWIMMING'});

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
    
    //testing this function
    //create_friend_directory("aditya",node);
}


async function create_friend_directory (friend_name,node){
   await node.files.mkdir(`/root_folder/${friend_name}`);
}

//BOTH FUNCTIONS HAVE BEEN TESTED AND ARE WORKING CORRECTLY , I HAVE CREATED THE NODE IN THE setupfolder() FUNCTION FOR NOW 
//ONLY TO TEST, WE CAN INITIALIZE ELSE WHERE  