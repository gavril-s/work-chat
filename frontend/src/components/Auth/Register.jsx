import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../App';
import { post } from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    surname: '',
    patronymic: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await post('/register', formData);
      
      if (response.success) {
        // After successful registration, log in the user
        const loginResponse = await post('/login', {
          username: formData.username,
          password: formData.password
        });
        
        if (loginResponse.success) {
          login({ 
            username: loginResponse.data.username,
            userId: loginResponse.data.user_id,
            fullName: loginResponse.data.full_name
          });
        } else {
          // Registration successful but login failed
          setError('Регистрация успешна. Пожалуйста, войдите в систему.');
          // Redirect to login page
          window.location.href = '/login';
        }
      } else {
        setError(response.message || 'Ошибка при регистрации');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setError('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h2 className="h4 mb-0">Регистрация</h2>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Имя пользователя:</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Имя:</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="surname" className="form-label">Фамилия:</label>
                <input
                  type="text"
                  className="form-control"
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="patronymic" className="form-label">Отчество:</label>
                <input
                  type="text"
                  className="form-control"
                  id="patronymic"
                  name="patronymic"
                  value={formData.patronymic}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Пароль:</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
            <div className="mt-3 text-center">
              <p>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
