import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import MessageInput from './MessageInput';
import Loading from '../Common/Loading';
import { get, post, createWebSocketConnection } from '../../services/api';

const ChatWindow = () => {
  const { id: chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const response = await get(`/chat/${chatId}`);

        if (response.success) {
          const { chat, messages, members, user_id, username } = response.data;
          
          // Format messages for display
          const formattedMessages = messages && messages.length > 0 
            ? messages.map(msg => ({
                id: msg.ID,
                username: msg.Username,
                content: msg.Content,
                file: msg.File && msg.File.Name ? {
                  name: msg.File.Name,
                  url: `/api/files/${msg.ID}`
                } : null,
                isCurrentUser: msg.UserID === user_id
              }))
            : [];
          
          // Format participants for display
          const formattedParticipants = members && members.length > 0
            ? members.map(member => ({
                name: member.Name && member.Surname ? `${member.Surname} ${member.Name} ${member.Patronymic || ''}` : member.Username,
                status: member.Status,
                lastActive: member.LastActive
              }))
            : [];
          
          setChat(chat);
          setMessages(formattedMessages);
          setParticipants(formattedParticipants);
          setCurrentUserId(user_id);
          setUsername(username);
        } else {
          setError(response.message || 'Не удалось загрузить данные чата');
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Ошибка при загрузке данных чата');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId]);

  // Set up WebSocket connection
  useEffect(() => {
    if (!loading && !error) {
      // Close previous connection if exists
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      const ws = createWebSocketConnection(chatId);

      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('WebSocket message received:', msg);
        
        if (msg.action === 'delete') {
          console.log('Deleting message with ID:', msg.id);
          // Remove deleted message
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== parseInt(msg.id));
            console.log('Messages after deletion:', filtered);
            return filtered;
          });
        } else if (msg.action === 'edit') {
          console.log('Editing message with ID:', msg.id, 'New content:', msg.content);
          // Update edited message
          setMessages(prev => {
            const updated = prev.map(m => 
              m.id === parseInt(msg.id) ? { ...m, content: msg.content } : m
            );
            console.log('Messages after edit:', updated);
            return updated;
          });
        } else {
          // Add new message
          const newMessage = {
            id: msg.ID,
            username: msg.Username,
            content: msg.Content,
            file: msg.File && msg.File.Name ? {
              name: msg.File.Name,
              url: `/api/files/${msg.ID}`
            } : null,
            isCurrentUser: msg.UserID === currentUserId
          };
          
          console.log('Adding new message:', newMessage);
          setMessages(prev => [...prev, newMessage]);
          
          // Show browser notification if message is not from current user
          if (msg.UserID !== currentUserId && Notification.permission === 'granted') {
            new Notification(msg.Username, { 
              body: msg.Content,
              icon: 'https://cdn4.iconfinder.com/data/icons/glyphs/24/icons_notifications-1024.png'
            });
          }
        }
        
        // Scroll to bottom when new messages arrive
        scrollToBottom();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      wsRef.current = ws;

      // Request notification permission
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      // Clean up on unmount
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [loading, error, chatId, currentUserId]);

  // Scroll to bottom on initial load and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content, file) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ Content: content, File: file }));
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const response = await post('/edit-message', {
        message_id: messageId.toString(),
        content: newContent,
        chat_id: chatId
      });

      if (response.success) {
        // Update message content locally
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, content: newContent } : msg
          )
        );
      } else {
        console.error('Failed to edit message:', response.message);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
      return;
    }

    try {
      const response = await post('/delete-message', {
        message_id: messageId.toString(),
        chat_id: chatId
      });

      if (response.success) {
        // Remove message locally
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        console.error('Failed to delete message:', response.message);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">Загрузка чата...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="row">
      <div className="col-md-9">
        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="h4 mb-0">Чат: {chat?.name}</h2>
            <Link to="/chats" className="btn btn-sm btn-outline-light">
              ← Назад к чатам
            </Link>
          </div>
          <div className="card-body p-0">
            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="text-center p-4">Нет сообщений</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.isCurrentUser ? 'message-mine' : 'message-other'}`}
                      data-id={message.id}
                    >
                      <strong>{message.username}:</strong> {message.content}
                      
                      {message.file && (
                        <div className="file-attachment">
                          <a href={message.file.url} target="_blank" rel="noopener noreferrer">
                            {message.file.name}
                          </a>
                        </div>
                      )}
                      
                      {message.isCurrentUser && (
                        <div className="message-actions">
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => {
                              const newContent = prompt('Редактировать сообщение:', message.content);
                              if (newContent !== null && newContent !== message.content) {
                                handleEditMessage(message.id, newContent);
                              }
                            }}
                          >
                            Редактировать
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h3 className="h5 mb-0">Участники чата</h3>
          </div>
          <div className="card-body p-0">
            <ul className="list-group list-group-flush">
              {participants.map((participant, index) => (
                <li key={index} className="list-group-item">
                  <div>{participant.name}</div>
                  <small className={`user-status-${participant.status}`}>
                    {participant.status === 'online' ? (
                      'Онлайн'
                    ) : (
                      `Последний раз в сети: ${participant.lastActive}`
                    )}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
