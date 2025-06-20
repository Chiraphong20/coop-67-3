import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/Login.css'; 
function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

 const handleLogin = (e) => {
  e.preventDefault();

  if (username === 'admin12312' && password === '12345') {
    localStorage.setItem('adminLoggedIn', 'true');
    window.location.href = '/dashboard/condo-room'; 
  } else {
    alert('Invalid username or password');
  }
};
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">
        <img src="/images/Condo_connect_3.png" alt="logo"   style={{ width: '250px', position: 'relative', top: '-140px' }}/>
        </div>
        <form onSubmit={handleLogin}>
          <label>User</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="form-footer">
            <div className="remember-me">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          <label>Remember me</label>
        </div>
      </div>
          <button type="submit" className="login-button">Sign in</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
