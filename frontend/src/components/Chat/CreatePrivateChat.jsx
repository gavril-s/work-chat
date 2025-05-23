import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post } from '../../services/api';
import Loading from '../Common/Loading';

const CreatePrivateChat = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const response = await get('/create_private_chat');
        console.log('API Response:', response);

        if (response.success) {
          console.log('Users from API:', response.data.users);
          if (response.data.users && response.data.users.length > 0) {
            setUsers(response.data.users);
          } else {
            console.warn('No users returned from API or empty array');
            setUsers([]);
          }
        } else {
          console.error('API returned error:', response.message);
          setError(response.message || 'Не удалось загрузить список пользователей');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Ошибка при загрузке пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Пожалуйста, выберите пользователя');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Convert selectedUserId to a number
      const userIdNum = parseInt(selectedUserId, 10);
      
      const response = await post('/create_private_chat', {
        user_id: userIdNum
      });
      
      if (response.success) {
        navigate(`/chat/${response.data.chat_id}`);
      } else {
        setError(response.message || 'Не удалось создать чат');
      }
    } catch (error) {
      console.error('Error creating private chat:', error);
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
            <h2 className="h4 mb-0">Создать личный чат</h2>
            <Link to="/chats" className="btn btn-sm btn-outline-light">
              ← Назад к чатам
            </Link>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="user" className="form-label">Выберите пользователя:</label>
                <select
                  id="user"
                  className="form-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">Выберите пользователя</option>
                  {users.map((user) => (
                    <option key={user.ID} value={user.ID}>
                      {user.Surname} {user.Name} {user.Patronymic}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="d-flex justify-content-between">
                <Link to="/chats" className="btn btn-secondary">
                  Отмена
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !selectedUserId}
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

export default CreatePrivateChat;
