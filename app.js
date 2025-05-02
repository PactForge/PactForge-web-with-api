const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai'); // Updated import style

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Set this in Render's environment variables
});

// API Route
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    const reply = completion.choices[0]?.message?.content || "No response";
    res.json({ reply });

  } catch (error) {
    console.error('OpenAI error:', error.message);
    res.status(500).json({ 
      error: 'AI service failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Frontend
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>PactForge</title>
  <style>
    body { font-family: Arial; background: #121212; color: #e0e0e0; margin: 0; }
    #header { background: #212121; padding: 15px; text-align: center; border-bottom: 1px solid #333; }
    #header h1 { margin: 0; color: #03a9f4; }
    #chat-container { background: #1e1e1e; padding: 15px; height: 80vh; overflow-y: auto; display: flex; flex-direction: column; }
    .user-message, .bot-message { padding: 10px 15px; margin-bottom: 10px; border-radius: 6px; max-width: 75%; }
    .user-message { background: #37474f; align-self: flex-end; }
    .bot-message { background: #212121; align-self: flex-start; }
    #input-area { background: #333; padding: 10px; position: fixed; bottom: 0; left: 0; right: 0; }
    #input-container { display: flex; }
    #user-input { flex-grow: 1; padding: 8px; background: #424242; border: 1px solid #555; border-radius: 4px; color: #e0e0e0; }
    #send-button { background: #03a9f4; color: white; border: none; border-radius: 4px; padding: 8px 15px; margin-left: 10px; cursor: pointer; }
    #send-button:hover { background: #0288d1; }
    #disclaimer { color: #888; font-size: 11px; text-align: center; margin-top: 5px; }
  </style>
</head>
<body>
  <div id="header">
    <h1>PactForge</h1>
  </div>
  <div id="chat-container">
    <div class="bot-message">Hello! I'm PactForge, your legal assistant. How can I help you today?</div>
  </div>
  <div id="input-area">
    <div id="input-container">
      <input type="text" id="user-input" placeholder="Type your request...">
      <button id="send-button">Send</button>
    </div>
    <div id="disclaimer">AI-generated content. Review with a legal professional before use.</div>
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
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
      }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
