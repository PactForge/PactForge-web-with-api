const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Grok API Configuration
const GROK_API_KEY = process.env.GROK_API_KEY || 'your-api-key-here';
const GROK_API_URL = 'https://api.grok.ai/v1/chat/completions'; // Update with actual Grok endpoint

// Grok API Route
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios.post(
      GROK_API_URL,
      {
        model: "grok-1", // Update with correct model name
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "No response from Grok";
    res.json({ reply });

  } catch (error) {
    console.error('Grok API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Grok API failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve frontend (unchanged from your original)
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
    <div class="bot-message">Hello! I'm PactForge with Grok AI. How can I assist with your legal agreements today?</div>
  </div>

  <div id="input-area">
    <div id="input-container">
      <input type="text" id="user-input" placeholder="Type your request..." />
      <button id="send-button">Send</button>
    </div>
    <div id="disclaimer">AI-generated content. Review with a legal professional before use.</div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
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
        sendButton.disabled = true;

        try {
          const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input })
          });

          if (!response.ok) throw new Error(await response.text());
          const data = await response.json();
          appendMessage(data.reply, 'bot-message');
        } catch (err) {
          appendMessage("Error: Please try again", 'bot-message');
          console.error(err);
        } finally {
          sendButton.disabled = false;
        }
      }

      sendButton.addEventListener('click', sendMessage);
      userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    });
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
