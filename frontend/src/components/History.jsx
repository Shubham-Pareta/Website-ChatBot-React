import React from 'react';

function History({ data, onViewLog, onDelete }) {
  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    console.log("Delete button clicked for session:", sessionId);
    if (window.confirm("Delete this research session?")) {
      onDelete(sessionId);
    }
  };

  return (
    <div className="history-page">
      <h2>Research History</h2>
      {(!data || data.length === 0) ? (
        <p style={{ color: '#94a3b8', marginTop: '20px' }}>No research sessions found yet.</p>
      ) : (
        <div className="history-list">
          {data.map((item) => (
            <div 
              key={item.session_id} 
              className="history-item" 
              onClick={() => onViewLog(item)}
            >
              <div className="history-info">
                <p className="history-url">{item.url || "Untitled Session"}</p>
                <small className="history-date">📅 {item.date}</small>
              </div>
              <button 
                className="delete-btn" 
                onClick={(e) => handleDelete(e, item.session_id)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;