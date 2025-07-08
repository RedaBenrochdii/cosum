// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FormPage from './pages/FormPage';
import Sidebar from './components/Sidebar';
import EmployeList from './components/EmployeList';
import DocumentsReceived from './pages/DocumentsReceived';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import './index.css';
import ReclamationPage from './pages/ReclamationPage';
import BordereauPage from './pages/BordereauPage';

const App = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {!isLoginPage && <Sidebar />}

      <main
        className="pageContent"
        style={{
          flex: 1,
          paddingLeft: !isLoginPage ? '220px' : '0px', // Décale le contenu vers la droite
          paddingRight: '20px',
          transition: 'padding 0.3s ease'
        }}
      >
        {!isLoginPage && <EmployeList />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/form" element={<PrivateRoute><FormPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><DocumentsReceived /></PrivateRoute>} />
          <Route path="/reclamation" element={<PrivateRoute><ReclamationPage /></PrivateRoute>} />
          <Route path="/bordereau" element={<BordereauPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
