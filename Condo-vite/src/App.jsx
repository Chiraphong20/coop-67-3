import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Profile from './Profile';
import Repair from './Repair';
import Payment from './Payment';
import BillDetail from './BillDetail';
import Register from './Register';
import Status from './Status';
import Dashboard from './Dashboard';
import Machanic from './machanic';
import Machanicstatus from './machanicstatus';
import MachanicCase from './machaniccase';
import Meet from './Meet';
import FinancePage from './FinancePage';
import PaymentMethod from './PaymentMethod';
import AdminLogin from './AdminLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/repair" element={<Repair />} />
        <Route path="/my-bills" element={<Payment />} />
        <Route path="/bill-detail/:id" element={<BillDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/status" element={<Status />} />
        <Route path="/payment-method/:id" element={<PaymentMethod />} />
        <Route path="/Meet" element={<Meet />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/dashboard/*"element={localStorage.getItem('adminLoggedIn') === 'true' ? (
              <Dashboard />
            ) : (
              <Navigate to="/admin-login" />
            )
          }
        />
        <Route path="/machaniccase" element={<MachanicCase />} />
        <Route path="/machanicstatus/:userId/:taskId" element={<Machanicstatus />} />
        <Route path="/machanic/:userId/:taskId" element={<Machanic />} />
        <Route path="Meet" element={<Meet />} />
        <Route path="finance" element={<FinancePage />} />
      </Routes>
    </Router>
  );
}

export default App;
