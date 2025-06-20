import React, { useState, useEffect } from 'react';
import {
  HomeOutlined,
  DollarOutlined,
  ToolOutlined,
  NotificationOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button } from 'antd';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import CondoRoom from './CondoRoom';
import CondoPayment from './CondoPayment';
import CondoReport from './CondoReport';
import Announcement from './Announcement';
import Staff from './Staff';
import CondoMeet from './CondoMeet';
import CondoStatus from './CondoStatus';
import Income from './Income';
import './CSS/Dashboard.css';

const { Header, Sider, Content } = Layout;

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem('adminLoggedIn') === 'true' ||
      sessionStorage.getItem('adminLoggedIn') === 'true';

    if (!isLoggedIn) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminLoggedIn');
    navigate('/admin-login');
  };

  return (
    <div className="dashboard-wrapper">
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          className="custom-header"
          style={{
            background: '#94B9FF',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', 
            position: 'fixed',
            width: '100%',
            zIndex: 1000,
            height: 64,
          }}
        >
          <div className="condoname">คอนโดพี่โต</div>
          
        </Header>

        <Layout style={{ paddingTop: 64 }}>
          <Sider collapsible collapsed={collapsed} trigger={<Button type="primary" danger onClick={handleLogout}>
            Logout
          </Button>} width={220} style={{ overflowY: 'auto' }}>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={['CondoRoom']}>
              <Menu.Item key="CondoRoom" icon={<HomeOutlined />}>
                <Link to="/dashboard/condo-room">ข้อมูลห้อง</Link>
              </Menu.Item>
              <Menu.Item key="CondoPayment" icon={<DollarOutlined />}>
                <Link to="/dashboard/payment">ค้างชำระ</Link>
              </Menu.Item>
              <Menu.Item key="CondoReport" icon={<ToolOutlined />}>
                <Link to="/dashboard/report">คำร้องเรียน / แจ้งซ่อม</Link>
              </Menu.Item>
              <Menu.Item key="CondoStatus" icon={<NotificationOutlined />}>
                <Link to="/dashboard/condostatus">ติดตามสถานะ</Link>
              </Menu.Item>
              <Menu.Item key="Announcement" icon={<NotificationOutlined />}>
                <Link to="/dashboard/announcement">ประกาศ</Link>
              </Menu.Item>
              <Menu.Item key="Staff" icon={<TeamOutlined />}>
                <Link to="/dashboard/staff">จัดการพนักงาน</Link>
              </Menu.Item>
              <Menu.Item key="CondoMeet" icon={<CalendarOutlined />}>
                <Link to="/dashboard/meet">ตรวจสอบการจอง</Link>
              </Menu.Item>
              <Menu.Item key="Income" icon={<CalendarOutlined />}>
                <Link to="/dashboard/income">แจ้งยอดรายรับ-จ่าย</Link>
              </Menu.Item>
             
            </Menu>
          </Sider>

          <Layout>
            <Content style={{ padding: 16, backgroundColor: 'white' }}>
              <Routes>
                <Route path="condo-room" element={<CondoRoom />} />
                <Route path="payment" element={<CondoPayment />} />
                <Route path="report" element={<CondoReport />} />
                <Route path="condostatus" element={<CondoStatus />} />
                <Route path="announcement" element={<Announcement />} />
                <Route path="staff" element={<Staff />} />
                <Route path="meet" element={<CondoMeet />} />
                <Route path="income" element={<Income />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </div>
  );
}

export default Dashboard;
