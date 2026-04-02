import React, { useState } from 'react';

export default function Settings() {
  const [apiKey, setApiKey] = useState("••••••••••••••••");

  return (
    <div className="view-container">
      <h2>System Settings</h2>
      
      <div className="settings-group">
        <label>Groq API Key</label>
        <div className="api-input-lock">
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
          />
          <button>Update</button>
        </div>
        <p className="help-text">This key is stored locally in your browser.</p>
      </div>

      <div className="settings-group">
        <label>Model Selection</label>
        <select disabled>
          <option>Llama-3.1-8b-instant (Default)</option>
          <option>Mixtral-8x7b</option>
        </select>
      </div>

      <div className="settings-group danger-zone">
        <h3>Danger Zone</h3>
        <button className="delete-btn">Clear All Local Data</button>
      </div>
    </div>
  );
}