import React, { useState, useEffect } from 'react';
import './CSS/Status.css';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import liff from '@line/liff';

const Status = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [modalOpen, setModalOpen] = useState(false);
  const [repairs, setRepairs] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
      await liff.init({ liffId: '2007355122-Y1D6GoVR' });
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const userAssignedTasksRef = collectionGroup(db, 'assignedTasks');
      const snapshot = await getDocs(userAssignedTasksRef);

      const taskMap = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const taskId = data.taskId;
        const createdAt = data.createdAt?.toDate() || new Date(0); 

        if (
          !taskMap[taskId] || 
          createdAt > (taskMap[taskId].createdAtObj || new Date(0))
        ) {
          taskMap[taskId] = {
            id: doc.id,
            ...data,
            createdAt: createdAt.toLocaleString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            createdAtObj: createdAt 
          };
        }
      });

      const filteredTasks = Object.values(taskMap);
      setRepairs(filteredTasks);
    } catch (err) {
      console.error('โหลดข้อมูลล้มเหลว:', err);
    }
  };

  fetchData();
}, []);


  const openTab = (tabId) => setActiveTab(tabId);
  const showDetail = (repair) => {
    setSelectedRepair(repair);
    setModalOpen(true);
  };
  const closeDetail = () => {
    setModalOpen(false);
    setSelectedRepair(null);
  };

const renderRepairItem = (repair) => (
  <li key={repair.id} className="status-item" onClick={() => showDetail(repair)}>
    <span className={`status ${getStatusClass(repair.status)}`}>
      {repair.status}
    </span>
    <span className="label">{repair.title}</span>
  </li>
);
const getStatusClass = (status) => {
  switch (status) {
    case 'ยังไม่ได้ดำเนินการ':
      return 'dot-red';
    case 'กำลังดำเนินการ':
      return 'dot-orange';
    case 'ซ่อมแซมเสร็จสิ้น':
      return 'dot-green';
    default:
      return '';
  }
};
  
   return (
    <div className="container-status-m">
        <h2 style={{ color: 'white' }}>ติดตามสถานะ</h2>
      <div className="tabs">
        <div className={`tab ${activeTab === 'status' ? 'active' : ''}`} onClick={() => openTab('status')}>
          ติดตามสถานะ
        </div>
        <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => openTab('history')}>
          ประวัติ
        </div>
      </div>

      {activeTab === 'status' && (
        <div className="tab-content active">
          <div className="tab-header">
            <div>สถานะ</div>
            <div>หัวข้อ</div>
          </div>
          <ul className="status-list">
            {repairs
              .filter(r => ['ซ่อมแซมไม่ได้', 'ยังไม่ได้ดำเนินการ', 'กำลังดำเนินการ'].includes(r.status))
              .map(renderRepairItem)}
          </ul>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="tab-content active">
          <div className="tab-header">
            <div>สถานะ</div>
            <div>หัวข้อ</div>
          </div>
          <ul className="status-list">
            {repairs
              .filter(r => r.status === 'ซ่อมแซมเสร็จสิ้น')
              .map(renderRepairItem)}
          </ul>
        </div>
      )}

      {modalOpen && selectedRepair && (
        <div className="modal" onClick={closeDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={closeDetail}>&times;</span>
            <div className='modal-header-info'> 
            <h3>รายละเอียดสถานะ</h3>
        </div>

            {selectedRepair.mediaType?.startsWith('video') ? (
              <video width="100%" style={{ maxWidth: '300px', display: 'block', margin: '0 auto' }} controls>
                <source src={selectedRepair.media} type={selectedRepair.mediaType} />
              </video>
            ) : (
              <img
                src={selectedRepair.media}
                alt="media"
                style={{ width: '100%', maxWidth: '200px', borderRadius: 10, display: 'block', margin: '0 auto' }}
              />
            )}

            <p><strong>ประเภท:</strong> {selectedRepair.type === 'complaint' ? 'ร้องเรียน' : 'แจ้งซ่อม'}</p>
            <p><strong>หัวข้อ:</strong> {selectedRepair.title}</p>
            <p><strong>วันที่:</strong> {selectedRepair.createdAt}</p>
            <p><strong>รายละเอียด:</strong> {selectedRepair.description}</p>

            {selectedRepair.officers?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p><strong>เจ้าหน้าที่:</strong></p>
                {selectedRepair.officers.map((officer, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <img
                      src={officer.profileImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                      alt="เจ้าหน้าที่"
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                    <div>
                      <div>{officer.name}</div>
                      <div>{officer.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedRepair.repairImages?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p><strong>รูปภาพหลังซ่อม:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {selectedRepair.repairImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`รูปซ่อม ${idx + 1}`}
                      style={{ width: 120, height: 'auto', borderRadius: 8 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Status;
