import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      parts: [{ text: input }]
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const apiUrl =
      window.location.port === "5173"
        ? "http://localhost:5000/api/chat"
        : "/api/chat";

    try {
      const response = await axios.post(
        apiUrl,
        { messages: updatedMessages }
      );

      const botMessage = {
        role: "model",
        parts: [{ text: response.data.reply }]
      };

      setMessages([...updatedMessages, botMessage]);

    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.reply ||
        "Could not connect to GenTalk backend. Please ensure the server is running on http://localhost:5000.";

      setMessages([
        ...updatedMessages,
        {
          role: "model",
          parts: [{
            text: errorMsg
          }]
        }
      ]);
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="app">

      <aside className="sidebar">
        <h2>💬 GenTalk</h2>

        <button className="new-chat" onClick={newChat}>
          + New Chat
        </button>

        <p className="side-text">Powered by Gemini AI</p>
      </aside>

      <main className="main">

        <header>
          <h3>GenTalk</h3>
          <span>AI Assistant</span>
        </header>

        <div className="chat-container" ref={chatContainerRef}>

          {messages.length === 0 && (
            <div className="welcome">
              <h1>Welcome to GenTalk! 👋</h1>
              <h2>How can I help you today?</h2>
              <p>Ask me anything.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "user" : "bot"
              }`}
            >
              <strong>
                {msg.role === "user" ? "You" : "GenTalk"}
              </strong>

              <p>{msg.parts?.[0]?.text || ""}</p>
            </div>
          ))}

          {loading && (
            <div className="message bot">
              <strong>GenTalk</strong>
              <p>Thinking...</p>
            </div>
          )}

        </div>

        <div className="input-container">

          <input
            type="text"
            placeholder="Message GenTalk..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            ➤
          </button>

        </div>

        <p className="footer">
          GenTalk can make mistakes. Verify important information.
        </p>

      </main>
    </div>
  );
}

export default App;
