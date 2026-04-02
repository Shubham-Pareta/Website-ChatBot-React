import React from 'react';

function Header({ user, onLogout, onNewChat, setView }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="logo" onClick={() => setView('chat')} style={{ cursor: 'pointer' }}>
          NeuralNexus
        </h1>
      </div>

      <div className="header-right">

        {user && (
          <div className="user-menu">
            {/* ✅ FIXED: Correctly closed the button tag below */}
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button> 
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;