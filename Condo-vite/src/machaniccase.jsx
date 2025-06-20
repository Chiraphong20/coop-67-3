import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Typography, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import liff from '@line/liff';
import "./CSS/machaniccase.css";

const { Title } = Typography;

const MachanicCase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [repairOrders, setRepairOrders] = useState([]);
  const [repairStatus, setRepairStatus] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: '2007355122-A26QKmoZ' });
        console.log("LIFF init success");

        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          const profile = await liff.getProfile();
          console.log("👤 LIFF profile:", profile);
          const uid = profile.userId;
          setUserId(uid);
          fetchAssignedTasks(uid);
        }
      } catch (error) {
        console.error('LIFF Error:', error);
        setLoading(false);
      }
    };

    const fetchAssignedTasks = async (uid) => {
      if (!uid) {
        console.warn('⚠️ userId is null');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const assignedRef = collection(db, 'users', uid, 'assignedTasks');
        const assignedSnap = await getDocs(assignedRef);

        const assignedList = assignedSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            ...(data.userInfo || {}),
            image: data.media || '',
            topic: data.title || '',
            detail: data.description || '',
            date: data.createdAt?.toDate?.().toLocaleDateString?.() || '-',
            status: data.status || 'pending',
          };
        });

        const orders = assignedList.filter(
          r => r.status === 'ยังไม่ได้ดำเนินการ' || !r.status || r.status === 'pending'
        );
        const status = assignedList.filter(
          r => r.status && r.status !== 'pending' && r.status !== 'ยังไม่ได้ดำเนินการ'
        );

        setRepairOrders(orders);
        setRepairStatus(status);
      } catch (error) {
        console.error('❌ ดึงข้อมูลไม่สำเร็จ:', error);
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, []);

const handleCardClick = (item) => {
  if (activeTab === 'orders') {
    navigate(`/machanic/${userId}/${item.id}`);
  } else {
    navigate(`/machanicstatus/${userId}/${item.id}`);
  }
};


  const currentItems = activeTab === 'orders' ? repairOrders : repairStatus;

  return (
    <div
      className="container-machaniccase"
      style={{
        padding: ' 16px 16px',
        backgroundColor: '#fff',
        minHeight: '100vh'
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#FFF' }}>
        {activeTab === 'orders' ? 'เคสสั่งซ่อม' : 'สถานะเคสสั่งซ่อม'}
      </h2>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        centered
        tabBarStyle={{
          color: '#fff',
        }}
        items={[
          { key: 'orders', label: <span style={{ color: '#fff' }}>คำสั่งซ่อม</span> },
          { key: 'status', label: <span style={{ color: '#fff' }}>สถานะการซ่อม</span> },
        ]}
      />

      {loading ? (
        <Spin spinning={loading} tip="กำลังโหลดงาน..." size="large">
          <div style={{ minHeight: '80vh' }} />
        </Spin>
      ) : currentItems.length === 0 ? (
        <p style={{ textAlign: 'center' }}>ยังไม่มีงาน</p>
      ) : (
        currentItems.map(item => (
          <Card
            key={item.id}
            hoverable
            onClick={() => handleCardClick(item)}
            style={{
              width: '95%',
              maxWidth: 440,
              borderRadius: 16,
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
              margin: '20px auto',
              backgroundColor: '#f9f9f9',
            }}
          >
            <Row gutter={16} style={{ alignItems: 'center' }}>
              <Col span={8}>
               <img
  src={item.image}
  alt={item.topic}
  style={{
    width: '100%',
    height: '130px',
    objectFit: 'cover',
    borderRadius: 12,
    display: 'block',
  }}
/>
              </Col>
             <Col
  span={16}
  className="card-text"
  style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '130px', 
    paddingLeft: 8,
  }}
>
  <h5 className="ant-typography" style={{ margin: 0 }}>


                <div className="infolabel"> <div style={{ textAlign: 'left', paddingLeft: 8 }}>
                  <Title  level={5} style={{ margin: '0 0 0px 0' , color: '#000'}}>ห้อง: {item.room || '-'}</Title>
                  <div><strong>ชื่อ:</strong> <span>{item.name || '-'}</span></div>
<div><strong>เบอร์:</strong> <span>{item.phone || '-'}</span></div>
<div><strong>หัวข้อ:</strong> <span>{item.topic || '-'}</span></div>
                <label class>รายละเอียด: </label> 
                  <span style={{ fontSize: 12, display: 'inline-block',  }}>
                    {item.detail || '-'}
                  </span>
                  {item.status && (
                    <>
                     <br/> <label>สถานะ: </label>
                      <span style={{ color: 'red' }}>{item.status}</span>
                    </>
                  )}
                  <br/><label>วันที่: </label>{item.date || '-'}
                  </div>  
                  
                </div>
                </h5>
              </Col>
            </Row>
          </Card>
        ))
      )}
    </div>
  );
};

export default MachanicCase;
