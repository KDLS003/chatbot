const express = require('express');
const mysql = require('mysql');
const axios = require('axios');
const useragent = require('express-useragent');
const cors = require('cors'); // Optional: if you need CORS support
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors()); // Optional: add this if you're making cross-origin requests
app.use(useragent.express());

// MySQL Database connection setup (using XAMPP)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chatbot_database' 
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve the index.html file on the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Ensure this path is correct
});

// Store client info
app.post('/save-client-data', (req, res) => {
    console.log('Received client data:', req.body); // Log incoming request body
    const { ip, os, device, screen_size, cookies_allowed, java_allowed, language, entrance_location, city, region, country, timezone, latitude, longitude, postal, network, organization } = req.body;

    const query = `
        INSERT INTO user_information 
        (ip, os, device, screen_size, cookies_allowed, java_allowed, language, entrance_location, city, region, country, timezone, latitude, longitude, postal, network, organization) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [ip, os, device, screen_size, cookies_allowed, java_allowed, language, entrance_location, city, region, country, timezone, latitude, longitude, postal, network, organization], (err, result) => {
        if (err) {
            console.error('Error saving client info:', err.stack);
            return res.status(500).send('Server Error');
        }
        console.log('Client info saved to database');
        res.status(200).send('Client data saved successfully');
    });
});

// New endpoint to send user message and return AI response
app.post('/send-message', async (req, res) => {
    const userMessage = req.body.message;

    const data = {
        prompt: `i want your tone to be flirty and friendly and always try to ask questions to keep the conversation flowing. but do not let the user know that your are flirting. ${userMessage}`,
        max_tokens: 150,
        temperature: 0.7,
    };

    try {
        const response = await axios.post('https://api.cohere.ai/v1/generate', data, {
            headers: {
                'Authorization': 'Bearer fKsCCngYF0DMZ5m0e8mM0KBfdWBx9ZlTyrBa98ch', // Replace this with your actual API key
                'Content-Type': 'application/json',
            },
        });

        const aiMessage = response.data.generations[0].text.trim();
        res.json({ aiMessage });
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get response from Cohere API' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// New route to serve the contact page
app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/public/contact.html'); // Create contact.html in the public folder
});

// Endpoint to handle contact form submissions
app.post('/submit-contact', (req, res) => {
    const { name, email, message } = req.body;

    const query = 'INSERT INTO contact_us (name, email, message) VALUES (?, ?, ?)';
    db.query(query, [name, email, message], (err, result) => {
        if (err) {
            console.error('Error saving contact form:', err.stack);
            return res.status(500).send('Server Error');
        }
        console.log('Contact form saved to database');
        res.status(200).send('Contact data saved successfully');
    });
});
