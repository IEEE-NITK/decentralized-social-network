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