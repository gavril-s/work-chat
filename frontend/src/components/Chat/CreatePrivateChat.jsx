import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
        const response = await fetch('/create_private_chat', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          // Parse HTML response
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Extract users from select options
          const options = doc.querySelectorAll('select option');
          const parsedUsers = Array.from(options)
            .filter(option => option.value !== '') // Skip empty option
            .map(option => ({
              id: option.value,
              name: option.textContent
            }));
          
          setUsers(parsedUsers);
        } else {
          setError('Не удалось загрузить список пользователей');
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
      const formData = new FormData();
      formData.append('user_id', selectedUserId);
      
      const response = await fetch('/create_private_chat', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (response.ok) {
        // Extract chat ID from response
        const text = await response.text();
        const match = text.match(/\/chat\/(\d+)/);
        
        if (match && match[1]) {
          navigate(`/chat/${match[1]}`);
        } else {
          navigate('/chats');
        }
      } else {
        const errorText = await response.text();
        setError(errorText || 'Не удалось создать чат');
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
                    <option key={user.id} value={user.id}>
                      {user.name}
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
