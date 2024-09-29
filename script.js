// Fetch necessary elements
const chatBox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const termsPrompt = document.getElementById('terms-prompt');
const agreeBtn = document.getElementById('agree-btn');
const sendBtn = document.getElementById('sendBtn');

// Client Data Collection (using ClientJS for device info)
const client = new ClientJS();
const deviceInfo = {
    os: client.getOS(),
    browser: client.getBrowser(),
    device: client.getDevice(),
    screen_size: `${window.screen.width}x${window.screen.height}`,
    cookies_allowed: navigator.cookieEnabled,
    java_allowed: navigator.javaEnabled(),
    language: navigator.language || navigator.userLanguage,
    entrance_location: document.referrer || 'Unknown',
};

// Fetch the user's public IP
async function fetchIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Failed to fetch IP address:', error);
        return null;
    }
}

// Function to fetch location data based on IP
async function fetchIpApiData(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching location data:', error);
        return null;
    }
}

// Handle user agreement
agreeBtn.addEventListener('click', async () => {
    const ip = await fetchIP(); // Fetch user's IP address
    if (!ip) {
        console.error('Unable to get IP address');
        return;
    }

    const locationData = await fetchIpApiData(ip);
    
    // If we get data from ipapi, include the new fields
    if (locationData) {
        deviceInfo.city = locationData.city || '';
        deviceInfo.region = locationData.region || '';
        deviceInfo.country = locationData.country || '';
        deviceInfo.timezone = locationData.timezone || '';
        deviceInfo.latitude = locationData.latitude || '';
        deviceInfo.longitude = locationData.longitude || '';
        deviceInfo.postal = locationData.postal || '';
        deviceInfo.network = locationData.network || '';
        deviceInfo.organization = locationData.org || '';
    } else {
        deviceInfo.city = 'Unknown';
        deviceInfo.region = 'Unknown';
        deviceInfo.country = 'Unknown';
        deviceInfo.timezone = 'Unknown';
    }

    console.log('Client Info:', deviceInfo); // Log client info before sending


    // Send client data to the backend
    const response = await fetch('/save-client-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...deviceInfo, ip }), // Include IP in the data
    });

    // Log response
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error saving client data:', errorText);
    } else {
        console.log('Client data saved successfully');
    }

    termsPrompt.style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    addMessage('ai', 'Start chatting!');
});

// Function to add messages to the chat box
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-bubble');
    messageContent.textContent = text;

    messageDiv.appendChild(messageContent);
    chatBox.appendChild(messageDiv);

    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to send user input to the backend
async function sendMessage(message) {
    addMessage('user', message);

    // Remove the "Start chatting!" bubble if it exists
    const startChatBubble = document.querySelector('.message-bubble');
    if (startChatBubble && startChatBubble.textContent === "Start chatting!") {
        startChatBubble.parentElement.remove();
    }

    try {
        const response = await fetch('/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }), // Send the user message
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const responseData = await response.json();
        const aiMessage = responseData.aiMessage; // Get AI response from the server
        addMessage('ai', aiMessage);
    } catch (error) {
        console.error('Error:', error);
        addMessage('ai', 'Sorry, something went wrong. Please try again.');
    }
}

// Send button click event listener
sendBtn.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message === '') return;
    sendMessage(message);
    userInput.value = '';
});

// Enter key event listener
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const message = userInput.value.trim();
        if (message !== '') {
            sendMessage(message);
            userInput.value = '';
        }
    }
});
