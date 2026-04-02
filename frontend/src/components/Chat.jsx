import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

function Chat({ onSaveHistory, existingSession, userEmail }) {
  const [url, setUrl] = useState("");
  const [isIndexed, setIsIndexed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (existingSession) {
      setUrl(existingSession.url);
      setIsIndexed(true);
      setMessages(existingSession.messages || []);
      setSessionId(existingSession.session_id);
    } else {
      setSessionId(`sess_${Date.now()}`);
      setUrl("");
      setIsIndexed(false);
      setMessages([]);
    }
  }, [existingSession]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const syncToCloud = (finalMessages) => {
    const sessionData = {
      id: sessionId,
      url: url,
      date: new Date().toLocaleString(),
      messages: finalMessages
    };
    onSaveHistory(sessionData);
  };

  const handleIndex = async () => {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }
    
    setLoading(true);
    
    try {
      // ✅ Updated to relative path
      const res = await fetch("/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: url,
          email: userEmail,
          session_id: sessionId
        })
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setIsIndexed(true);
        const welcome = { role: "bot", text: `✅ Successfully indexed **${url}**. You can now ask questions.` };
        setMessages([welcome]);
        syncToCloud([welcome]);
      } else {
        alert(`Indexing failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Index error:", error);
      alert("Failed to connect to the server.");
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", text: input };
    const midMessages = [...messages, userMsg];
    setMessages(midMessages);
    setInput("");
    setLoading(true);

    try {
      // ✅ Updated to relative path
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: userMsg.text,
          email: userEmail,
          session_id: sessionId
        })
      });
      
      const data = await res.json();
      const finalMessages = [...midMessages, { role: "bot", text: data.answer }];
      setMessages(finalMessages);
      syncToCloud(finalMessages);
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to get answer.");
    }
    setLoading(false);
  };

  return (
    <div className="chat-component">
      {!isIndexed ? (
        <div className="index-container">
          <div className="welcome-state">
            <div className="bot-avatar">
              <img src="/robot.png" alt="Robot" style={{ width: '100px', height: '100px' }} />
            </div>
            <h2>NeuralNexus</h2>
            <div className="url-input-group">
              <input 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="Enter URL..." 
              />
              <button className="train-btn" onClick={handleIndex} disabled={loading}>
                {loading ? <div className="loader-spinner"></div> : "Train AI"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="message-feed">
            {messages.map((m, i) => (
              <div key={i} className={`message-row ${m.role === "user" ? "user-row" : "bot-row"}`}>
                <div className="bubble">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-row bot-row">
                <div className="bubble">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <div className="input-container">
            <div className="input-wrapper">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSend()} 
                placeholder="Ask anything about the website..." 
              />
              <button onClick={handleSend} disabled={loading}>
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Chat;