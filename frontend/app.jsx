import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./app.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64Data = typeof result === "string" ? result.split(",")[1] : "";
      setSelectedImage({
        base64: base64Data,
        mimeType: file.type,
        previewUrl: result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !selectedImage) || loading) return;

    const promptText = trimmedInput || (selectedImage ? "Please analyze this image." : "");

    const userMessage = {
      role: "user",
      parts: [{ text: promptText }],
      image: selectedImage?.previewUrl || null,
      mimeType: selectedImage?.mimeType || null,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    const imageBase64ToSend = selectedImage?.base64 || null;
    const imageMimeToSend = selectedImage?.mimeType || null;

    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setLoading(true);

    const apiUrl =
      window.location.port === "5173"
        ? "http://localhost:5000/api/chat"
        : "/api/chat";

    try {
      const response = await axios.post(apiUrl, {
        messages: updatedMessages,
        image: imageBase64ToSend,
        mime_type: imageMimeToSend,
        message: promptText,
      });

      const botMessage = {
        role: "model",
        parts: [{ text: response.data.reply }],
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
          parts: [{ text: errorMsg }],
        },
      ]);
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    removeSelectedImage();
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>💬 GenTalk</h2>

        <button className="new-chat" onClick={newChat}>
          + New Chat
        </button>
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
              <p>Ask me anything, or attach an image to analyze.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === "user" ? "user" : "bot"}`}
            >
              <strong>{msg.role === "user" ? "You" : "GenTalk"}</strong>

              {msg.image && (
                <img
                  src={msg.image}
                  alt="Uploaded attachment"
                  className="chat-image"
                />
              )}

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

        {selectedImage && (
          <div className="image-preview-bar">
            <div className="preview-container">
              <img
                src={selectedImage.previewUrl}
                alt="Thumbnail preview"
                className="preview-thumbnail"
              />
              <button
                type="button"
                className="remove-img-btn"
                onClick={removeSelectedImage}
                title="Remove photo"
              >
                ✕
              </button>
            </div>
            <span className="preview-text">{selectedImage.name}</span>
          </div>
        )}

        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageSelect}
          />

          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Attach image"
          >
            📷
          </button>

          <input
            type="text"
            placeholder={
              selectedImage
                ? "Ask a question about this photo..."
                : "Message GenTalk..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !selectedImage)}
            title="Send"
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
