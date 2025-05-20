import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatList from './components/Chat/ChatList';
import ChatWindow from './components/Chat/ChatWindow';
import Header from './components/Common/Header';
import Loading from './components/Common/Loading';
import CreatePrivateChat from './components/Chat/CreatePrivateChat';
import CreateGroupChat from './components/Chat/CreateGroupChat';
import { get, post } from './services/api';

// Create a context for authentication
export const AuthContext = React.createContext();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await get('/chats');

        if (response.ok) {
          setIsAuthenticated(true);
          // We don't have a specific endpoint to get user info,
          // so we'll just set authenticated status for now
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/chats');
  };

  const logout = async () => {
    try {
      const response = await post('/logout');

      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return <Loading message="Загрузка приложения..." />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <div className="container-fluid p-0">
        <Header />
        <main className="container mt-4">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chats" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/chats" />} />
            <Route path="/chats" element={isAuthenticated ? <ChatList /> : <Navigate to="/login" />} />
            <Route path="/chat/:id" element={isAuthenticated ? <ChatWindow /> : <Navigate to="/login" />} />
            <Route path="/create_private_chat" element={isAuthenticated ? <CreatePrivateChat /> : <Navigate to="/login" />} />
            <Route path="/create_group_chat" element={isAuthenticated ? <CreateGroupChat /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/chats" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
};

export default App;
