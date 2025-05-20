import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App';

const Header = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  // Don't show header on login and register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="bg-dark text-white p-3">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/chats" className="h4 m-0 text-white text-decoration-none">Чат-приложение</Link>
        {isAuthenticated && (
          <div className="d-flex align-items-center">
            {user && (
              <span className="me-3">
                {user.fullName || user.username}
              </span>
            )}
            <Link to="/chats" className="btn btn-outline-light me-2">
              Чаты
            </Link>
            <button onClick={handleLogout} className="btn btn-danger">
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
