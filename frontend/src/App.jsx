import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Header from "./components/Header";
import Chat from "./components/Chat";
import History from "./components/History";
import "./App.css";

function App() {
  const [view, setView] = useState("chat");
  const [activeSession, setActiveSession] = useState(null);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user on page load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log("Found saved user:", parsedUser.email);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch history when user is set
  useEffect(() => {
    if (user) {
      console.log("User detected, fetching history for:", user.email);
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      console.log("Fetching history for:", user.email);
      // ✅ Updated: Relative path for Render
      const response = await fetch(`/api/get-history/${user.email}`);
      const data = await response.json();
      console.log("History data received:", data.length, "records");
      setHistory(data || []);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  const handleLoginSuccess = (res) => {
    const userData = jwtDecode(res.credential);
    console.log("Login successful:", userData.email);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log("Logging out");
    setUser(null);
    setHistory([]);
    setActiveSession(null);
    localStorage.removeItem("user");
  };

  const handleNewChat = () => {
    setActiveSession(null);
    setView("chat");
  };

  const handleSaveHistory = async (sessionData) => {
    console.log("Saving history to database:", sessionData);

    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => String(item.session_id) !== String(sessionData.id),
      );
      const formattedSession = {
        ...sessionData,
        session_id: String(sessionData.id),
      };
      return [formattedSession, ...filtered];
    });

    try {
      // ✅ Updated: Relative path for Render
      const response = await fetch("/api/save-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          session: sessionData,
        }),
      });
      console.log("Save response status:", response.status);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDeleteHistory = async (idToDelete) => {
    if (!idToDelete) {
      console.warn("Delete aborted: No ID provided.");
      return;
    }

    console.log("Attempting to delete ID:", idToDelete);
    const currentHistory = [...history];

    setHistory((prev) =>
      prev.filter((item) => String(item.session_id) !== String(idToDelete)),
    );

    if (activeSession?.session_id === idToDelete) {
      setActiveSession(null);
    }

    try {
      // ✅ Updated: Relative path for Render
      // Data is now passed as query parameters after the '?'
      const response = await fetch(
        `/api/delete-history?email=${user.email}&id=${idToDelete}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setHistory(currentHistory);
        alert(`Failed to delete: ${result.message}`);
      } else {
        await fetchHistory();
      }
    } catch (err) {
      console.error("Network error during delete:", err);
      setHistory(currentHistory);
      alert("Network error. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user)
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="login-background">
            <div className="gradient-sphere"></div>
            <div className="gradient-sphere2"></div>
          </div>

          <div className="login-card">
            <div className="logo-container">
              <div className="logo-icon">
                <img
                  src="login.jpeg"
                  alt="NeuralNexus Logo"
                  className="logo-image"
                />
              </div>
              <h1 className="project-name">NeuralNexus</h1>
              <p className="tagline">Intelligent Research Assistant</p>
            </div>

            <div className="login-divider">
              <span>Continue with</span>
            </div>

            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.log("Login Failed")}
                useOneTap={false}
                theme="filled_blue" // Optional: Changing theme also helps reset the look
                shape="pill" // Optional: Modern rounded look
                width="100%"
                text="signin_with" // 👈 This forces the generic "Sign in with Google" text
              />
            </div>

            <div className="login-footer">
              <p>Secure access to your research history</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="app-shell">
      <Header
        user={user}
        onLogout={handleLogout}
        onNewChat={handleNewChat}
        setView={setView}
      />
      <div className="main-layout">
        <aside className="sidebar">
          <nav className="sidebar-section">
            <div
              className={`menu-item ${view === "chat" ? "active" : ""}`}
              onClick={handleNewChat}
            >
              💬 New Chat
            </div>
            <div
              className={`menu-item ${view === "history" ? "active" : ""}`}
              onClick={() => setView("history")}
            >
              📁 History
            </div>
          </nav>
        </aside>
        <main className="chat-viewport">
          {view === "chat" && (
            <Chat
              userEmail={user.email}
              onSaveHistory={handleSaveHistory}
              existingSession={activeSession}
            />
          )}
          {view === "history" && (
            <History
              data={history}
              onViewLog={(item) => {
                setActiveSession(item);
                setView("chat");
              }}
              onDelete={handleDeleteHistory}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
