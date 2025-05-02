const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment configuration
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Gemini API configuration - now using environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-default-key-here';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Improved Gemini route
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout
      }
    );

    // More robust response parsing
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text 
      || response.data?.promptFeedback?.blockReason 
      || 'No reply from Gemini';

    res.json({ reply: text });

  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to process your request';
    let statusCode = 500;
    
    if (error.response) {
      // Handle different Gemini API error responses
      statusCode = error.response.status;
      errorMessage = error.response.data?.error?.message || errorMessage;
    } else if (error.request) {
      errorMessage = 'No response from Gemini API';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve the chat UI (unchanged)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>PactForge</title>
  <style>
    body { margin: 0; font-family: Arial; background-color: #121212; color: #e0e0e0; }
    #header { background-color: #212121; padding: 15px; text-align: center; border-bottom: 1px solid #333; }
    #header h1 { margin: 0; color: #03a9f4; font-size: 24px; }
    #chat-container { flex-grow: 1; margin: 0; background-color: #1e1e1e; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; height: 80vh; }
    .user-message, .bot-message { padding: 10px 15px; margin-bottom: 10px; border-radius: 6px; clear: both; max-width: 75%; }
    .user-message { background-color: #37474f; color: #e0e0e0; align-self: flex-end; }
    .bot-message { background-color: #212121; color: #e0e0e0; align-self: flex-start; }
    #input-area { display: flex; flex-direction: column; padding: 10px; background-color: #333; position: fixed; bottom: 0; left: 0; right: 0; box-sizing: border-box; }
    #input-container { display: flex; width: 100%; }
    #user-input { flex-grow: 1; padding: 8px; border: 1px solid #555; border-radius: 4px; margin-right: 10px; background-color: #424242; color: #e0e0e0; }
    #send-button { padding: 8px 15px; background-color: #03a9f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
    #send-button:hover { background-color: #0288d1; }
    #disclaimer { font-size: 11px; color: #888; text-align: center; margin-top: 5px; }
  </style>
</head>
<body>
  <div id="header">
    <h1>PactForge</h1>
  </div>

  <div id="chat-container">
    <div class="bot-message">Hi there! I'm PactForge, your agreement assistant. I can help you create various legal agreements. What kind would you like to make? For example, you can choose from Contractor, Employment, Franchise, NDA, or Rent.</div>
  </div>

  <div id="input-area">
    <div id="input-container">
      <input type="text" id="user-input" placeholder="Type your request..." />
      <button id="send-button">Send</button>
    </div>
    <div id="disclaimer">PactForge is an AI assistant. Agreements generated may contain errors or omissions. Always review with a legal professional before signing.</div>
  </div>

  <script>
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    function appendMessage(text, className) {
      const div = document.createElement('div');
      div.className = className;
      div.textContent = text;
      chatContainer.appendChild(div);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
      const input = userInput.value.trim();
      if (!input) return;

      appendMessage(input, 'user-message');
      userInput.value = '';
      userInput.disabled = true;
      sendButton.disabled = true;

      try {
        const res = await fetch('/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input })
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        appendMessage(data.reply, 'bot-message');
      } catch (err) {
        console.error('Error:', err);
        appendMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot-message');
      } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
      }
    }

    sendButton.onclick = sendMessage;
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
