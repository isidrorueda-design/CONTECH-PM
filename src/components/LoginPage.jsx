// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth(); 
  const navigate = useNavigate(); 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const redirectTo = await login(email, password);
      navigate(redirectTo);

    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError(err.response?.data?.detail || 'Error al iniciar sesión.');
    }
  };

  const loginContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
  };
  const loginFormStyle = {
    maxWidth: '400px',
    width: '100%',
    padding: '2rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  };
  const inputStyle = { width: 'calc(100% - 16px)', padding: '8px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' };
  const buttonStyle = { width: '100%', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' };

  return (
    <div style={loginContainerStyle}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: '100%', maxWidth: '400px', marginBottom: '1rem', objectFit: 'contain' }}
      />
      <form onSubmit={handleSubmit} style={loginFormStyle}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Iniciar Sesión</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <div className="form-group">
          <label htmlFor="email" style={{ fontWeight: 'bold' }}>Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" style={{ fontWeight: 'bold' }}>Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <button type="submit" style={buttonStyle}>Entrar</button>
      </form>
    </div>
  );
}

export default LoginPage;