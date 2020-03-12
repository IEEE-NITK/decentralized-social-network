// Display the Profile Page
document.getElementById("profile-btn").onclick = () => {

    // Display the requested section
    display("Profile");
}

// Add A Friend
document.getElementById("add-friend-btn").onclick = () => {

    // Extract the contents of the submission
    var friend_peer_id = document.getElementById("add-friend-id").value;

    // Ensure the fields weren't empty on submission
    if (!(friend_peer_id)) {
        alert("Please enter a value before submitting.");
        return;
    }

    // Add the friend
    alert("Friend added.");
}

// Add data to the Public Profile
document.getElementById("save-to-profile-btn").onclick = () => {

    // Extract the contents of the submission
    var profile_info = document.getElementById("profile-info").value;
    var profile_filename = document.getElementById("profile-filename").value;

    // Ensure the fields weren't empty on submission
    if (!(profile_info) || !(profile_filename)) {
        alert("Please enter all fields before submitting.");
        return;
    }

    // Save the data to public profile
    alert("Public Profile Updated.");
}

// Display the Friend Posts Page
document.getElementById("friends-posts-btn").onclick = () => {

    // Display the requested section
    display("Friend-Posts");
}

// Display the Friend's Posts when a View Request is made
document.getElementById("view-friend-posts-btn").onclick = () => {

    // Extract the submitted value
    var friend_peer_id = document.getElementById("view-friend-posts-id").value;

    // Ensure the form wasn't empty on submission
    if (!(friend_peer_id)) {
        alert("Please enter a value before submitting.");
        return;
    }

    // Display the requested friend's posts list
    document.getElementById('friend-posts-list').style.display = 'block';
}

// Write a post to a friend
document.getElementById("write-friend-post-btn").onclick = () => {

    // Extract the contents of the submission
    var friend_peer_id = document.getElementById("write-friend-post-id").value;
    var friend_post_content = document.getElementById("write-friend-post-content").value;
    var friend_post_filename = document.getElementById("write-friend-post-filename").value;

    // Ensure the fields weren't empty on submission
    if (!(friend_peer_id) || !(friend_post_content) || !(friend_post_filename)) {
        alert("Please enter all values before submitting.");
        return;
    }

    // Write the post
    alert("Post has been written");
}

// Display the Group Posts Page
document.getElementById("group-posts-btn").onclick = () => {

    // Display the requested section
    display("Group-Posts");
}

// Display the Friend's Group Posts when a View Request is made
document.getElementById("view-group-posts-btn").onclick = () => {

    // Extract the contents of the submission
    var friend_peer_id = document.getElementById("read-group-posts-id").value;

    // Ensure the fields weren't empty on submission
    if (!(friend_peer_id)) {
        alert("Please enter all values before submitting.");
        return;
    }

    // Read the group posts and display them
    document.getElementById('group-posts-list').style.display = 'block';
}

// Write a Group Post
document.getElementById("write-group-post-btn").onclick = () => {

    // Extract the contents of the submission
    var group_post_content = document.getElementById("write-friend-post-content").value;
    var group_post_filename = document.getElementById("write-friend-post-filename").value;

    // Ensure the fields weren't empty on submission
    if (!(group_post_content) || !(group_post_filename)) {
        alert("Please enter all values before submitting.");
        return;
    }

    // Write the post
    alert("Post has been written");
}

// Display Chat Page
document.getElementById("start-a-chat-btn").onclick = () => {

    // Display the requested section
    display("Chat");
}

// Accept Channel Name and Display Chat Body
document.getElementById("connect-to-channel-btn").onclick = () => {

    // Extract the contents of the submission
    var channel_name = document.getElementById("chat-channel").value;

    // Ensure the fields weren't empty on submission
    if (!(channel_name)) {
        alert("Please enter all values before submitting.")
        return;
    }

    // Connect to the channel and open the chat window
    display("Chat-Body");
}

// Accept, send and display the typed message
document.getElementById("send-message-btn").onclick = () => {

    // Extract the contents of the submission
    var channel_message = document.getElementById("chat-message").value;

    // Ensure the fields weren't empty on submission
    if (!(channel_message)) {
        alert("Please enter all values before submitting.")
        return;
    }

    // Send the message and display it on the window
    alert("Message sent")
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