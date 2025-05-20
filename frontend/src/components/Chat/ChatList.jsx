import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get } from '../../services/api';
import Loading from '../Common/Loading';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await get('/chats');

        if (response.success) {
          setChats(response.data.chats || []);
          // Check if user data is available and format the full name
          if (response.data.user) {
            const user = response.data.user;
            // Try to get full_name directly, or construct it from Name, Surname, Patronymic
            const fullName = user.full_name || 
              (user.Surname && user.Name ? 
                `${user.Surname} ${user.Name} ${user.Patronymic || ''}` : 
                user.username || 'Пользователь');
            setFullName(fullName);
          }
        } else {
          setError(response.message || 'Не удалось загрузить список чатов');
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Ошибка при загрузке чатов');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">Загрузка чатов...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="row">
      <div className="col-md-8 mx-auto">
        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="h4 mb-0">Чаты пользователя: {fullName}</h2>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <Link to="/create_private_chat" className="btn btn-outline-primary me-2">
                Создать личный чат
              </Link>
              <Link to="/create_group_chat" className="btn btn-outline-primary">
                Создать групповой чат
              </Link>
            </div>
            
            {chats.length === 0 ? (
              <p className="text-center">У вас пока нет чатов</p>
            ) : (
              <ul className="list-group">
                {chats.map((chat) => (
                  <li
                    key={chat.ID}
                    className="list-group-item chat-list-item d-flex justify-content-between align-items-center"
                    onClick={() => navigate(`/chat/${chat.ID}`)}
                  >
                    <div>
                      <span>{chat.Name}</span>
                      <small className="text-muted ms-2">
                        ({chat.IsPrivate ? 'Личный' : 'Групповой'})
                      </small>
                    </div>
                    {chat.UnreadMessageCount > 0 && (
                      <span className="badge unread-badge">{chat.UnreadMessageCount}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
