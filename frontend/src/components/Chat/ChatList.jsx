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

        if (response.ok) {
          // Since we're migrating from a template-based approach to a React app,
          // we need to parse the HTML response to extract the data
          // In a real-world scenario, the backend would be modified to return JSON
          const html = await response.text();
          
          // Create a temporary DOM element to parse the HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Extract the user's full name
          const nameElement = doc.querySelector('h1');
          if (nameElement) {
            const fullNameText = nameElement.textContent;
            setFullName(fullNameText.replace('Чаты пользователя: ', ''));
          }
          
          // Extract the chat list
          const chatElements = doc.querySelectorAll('ul li');
          const parsedChats = Array.from(chatElements).map(li => {
            const link = li.querySelector('a');
            const unreadText = li.querySelector('i')?.textContent || '';
            const unreadMatch = unreadText.match(/(\d+)/);
            const unreadCount = unreadMatch ? parseInt(unreadMatch[1]) : 0;
            
            // Extract chat ID from href
            const href = link?.getAttribute('href') || '';
            const idMatch = href.match(/\/chat\/(\d+)/);
            const id = idMatch ? idMatch[1] : '';
            
            // Extract chat name and type
            const text = link?.textContent || '';
            const typeText = li.textContent.includes('Личный') ? 'Личный' : 'Групповой';
            
            return {
              id,
              name: text,
              isPrivate: typeText === 'Личный',
              unreadMessageCount: unreadCount
            };
          });
          
          setChats(parsedChats);
        } else {
          setError('Не удалось загрузить список чатов');
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
                    key={chat.id}
                    className="list-group-item chat-list-item d-flex justify-content-between align-items-center"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <div>
                      <span>{chat.name}</span>
                      <small className="text-muted ms-2">
                        ({chat.isPrivate ? 'Личный' : 'Групповой'})
                      </small>
                    </div>
                    {chat.unreadMessageCount > 0 && (
                      <span className="badge unread-badge">{chat.unreadMessageCount}</span>
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
