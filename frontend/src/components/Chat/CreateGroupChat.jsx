import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post } from '../../services/api';
import Loading from '../Common/Loading';

const CreateGroupChat = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatName, setChatName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users for group chat...');
        const response = await get('/create_group_chat');
        console.log('API Response (Group Chat):', response);

        if (response.success) {
          console.log('Users from API (Group Chat):', response.data.users);
          if (response.data.users && response.data.users.length > 0) {
            setUsers(response.data.users);
          } else {
            console.warn('No users returned from API or empty array for group chat');
            setUsers([]);
          }
        } else {
          console.error('API returned error for group chat:', response.message);
          setError(response.message || 'Не удалось загрузить список пользователей');
        }
      } catch (error) {
        console.error('Error fetching users for group chat:', error);
        setError('Ошибка при загрузке пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (chatName.trim() === '') {
      setError('Пожалуйста, введите название чата');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Пожалуйста, выберите хотя бы одного пользователя');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Convert all selectedUsers IDs to numbers
      const userIdsNum = selectedUsers.map(id => parseInt(id, 10));
      
      const response = await post('/create_group_chat', {
        name: chatName,
        user_ids: userIdsNum
      });
      
      if (response.success) {
        navigate(`/chat/${response.data.chat_id}`);
      } else {
        setError(response.message || 'Не удалось создать чат');
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError('Ошибка при создании чата');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">Загрузка...</div>;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="h4 mb-0">Создать групповой чат</h2>
            <Link to="/chats" className="btn btn-sm btn-outline-light">
              ← Назад к чатам
            </Link>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="chatName" className="form-label">Название чата:</label>
                <input
                  type="text"
                  className="form-control"
                  id="chatName"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Выберите участников:</label>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {users.length === 0 ? (
                    <p className="text-muted">Нет доступных пользователей</p>
                  ) : (
                    users.map((user) => (
                      <div className="form-check mb-2" key={user.ID}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`user-${user.ID}`}
                          value={user.ID}
                          checked={selectedUsers.includes(user.ID)}
                          onChange={() => handleUserSelection(user.ID)}
                        />
                        <label className="form-check-label" htmlFor={`user-${user.ID}`}>
                          {user.Surname} {user.Name} {user.Patronymic}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 text-muted">
                  Выбрано пользователей: {selectedUsers.length}
                </div>
              </div>
              
              <div className="d-flex justify-content-between">
                <Link to="/chats" className="btn btn-secondary">
                  Отмена
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || chatName.trim() === '' || selectedUsers.length === 0}
                >
                  {submitting ? 'Создание...' : 'Создать чат'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupChat;
