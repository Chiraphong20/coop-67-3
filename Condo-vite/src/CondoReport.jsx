import React, { useState, useEffect } from 'react';
import { Input, Button, Modal, Avatar, Spin } from 'antd';
import { collection, collectionGroup, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import './CSS/CondoReport.css';

const CondoReport = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const repairColRef = collectionGroup(db, 'repair');
        const repairSnapshot = await getDocs(repairColRef);
        const repairList = repairSnapshot.docs.map(doc => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
          type: 'แจ้งซ่อม',
        }));

        const complaintColRef = collectionGroup(db, 'complaint');
        const complaintSnapshot = await getDocs(complaintColRef);
        const complaintList = complaintSnapshot.docs.map(doc => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
          type: 'ร้องเรียน',
        }));

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const techList = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === 'technician');
        setTechnicians(techList);

        setItems([...repairList, ...complaintList]);
      } catch (error) {
        console.error('โหลดข้อมูลไม่สำเร็จ:', error);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setSelectedTechnician(item.officers?.[0] || null);
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setSelectedTechnician(null);
  };

 const handleAssign = async () => {
  if (!selectedItem || !selectedTechnician) return;

  if (!selectedTechnician.id) {
    alert('⚠️ ไม่พบ userId ของช่าง กรุณาตรวจสอบว่าใน Firebase มี field userId (LINE UID) อยู่หรือไม่');
    console.warn('❌ ไม่มี userId:', selectedTechnician);
    return;
  }

  try {
    setLoading(true);
    await updateDoc(selectedItem.ref, {
      officers: [selectedTechnician],
      status: 'กำลังดำเนินการ',
    });
    await setDoc(
      doc(db, 'users', selectedTechnician.id, 'assignedTasks', selectedItem.id),
      {
        ...selectedItem,
        officers: [selectedTechnician],
        status: 'ยังไม่ได้ดำเนินการ',
        assignedAt: new Date(),
        createdAt: selectedItem.createdAt || new Date(),
        userInfo: selectedItem.userInfo || {},
        media: selectedItem.media || '',
        title: selectedItem.title || '',
        description: selectedItem.description || '',
      }
    );

    const message = `📌 คุณได้รับมอบหมายงานใหม่: ${selectedItem.title || 'ไม่ระบุ'}\nรายละเอียด: ${selectedItem.description}\nnกรุณาตรวจสอบในระบบ`;
    console.log('📦 ส่ง PUSH ถึงช่าง:', {
      userId: selectedTechnician.userId,
      message,
    });

    const response = await fetch('https://api-production-8655.up.railway.app/api/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: selectedTechnician.id,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Push API error:', errorData);
      throw new Error('ส่งข้อความแจ้งเตือนไม่สำเร็จ');
    }

    setItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));

    alert('✅ มอบหมายงานและส่งแจ้งเตือนเรียบร้อยแล้ว');
    handleCancel();
  } catch (err) {
    console.error('❌ มอบหมายงานล้มเหลว:', err);
    alert('เกิดข้อผิดพลาดในการมอบหมายงาน หรือส่งแจ้งเตือน');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="content-report">
      <div className="sectionheader">
        <div className="search-box">
          <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" width="20" height="20" alt="search" />
          <Input placeholder="ค้นหา..." bordered={false} />
        </div>
        <p>รับเรื่องร้องขอ</p>
        <div className="Group"></div>
      </div>

      <div className="room-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin tip="กำลังโหลด..." size="large" />
          </div>
        ) : items.length === 0 ? (
          <p>ไม่มีข้อมูล</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="room-card" onClick={() => handleCardClick(item)}>
              <img
                src={
                  item.type === 'แจ้งซ่อม'
                    ? 'https://cdn-icons-png.flaticon.com/512/6001/6001179.png'
                    : 'https://cdn-icons-png.flaticon.com/512/1828/1828911.png'
                }
                alt={item.type}
                style={{ width: 60, margin: '10px 0' }}
              />
              <div><b>{item.userInfo?.name || '-'}</b></div>
              <div><b>เบอร์ : {item.userInfo?.phone || '-'}</b></div>
              <div><b>ห้อง {item.userInfo?.room || '-'}</b></div>
              <div><b>{item.title || '-'}</b></div>
            </div>
          ))
        )}
      </div>

      <Modal
        title={<span style={{ color: 'black' }}>รับเรื่องร้องขอ</span>}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        {selectedItem && (
          <div>
            <p><b>หมวดหมู่:</b> {selectedItem.type}</p>
            <p><b>หัวข้อ:</b> {selectedItem.title}</p>
            <p><b>ข้อมูลเพิ่มเติม:</b></p>
            <p>{selectedItem.description}</p>

            {selectedItem.media && (
              <>
                <p><b>มีเดีย:</b></p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedItem.mediaType?.startsWith('video') ? (
                    <video width="300" height="200" controls style={{ borderRadius: 8 }}>
                      <source src={selectedItem.media} type={selectedItem.mediaType} />
                    </video>
                  ) : (
                    <img
                      src={selectedItem.media}
                      alt="media"
                      width={200}
                      height={200}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  )}
                </div>
              </>
            )}

            {technicians.length > 0 && (
              <>
                <p><b>เลือกช่างเพื่อมอบหมาย:</b></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {technicians.map((tech) => (
                    <div
                      key={tech.id}
                      onClick={() => setSelectedTechnician(tech)}
                      style={{
                        border: selectedTechnician?.id === tech.id ? '2px solid #1890ff' : '1px solid #ccc',
                        padding: 10,
                        borderRadius: 8,
                        cursor: 'pointer',
                        width: 180,
                        textAlign: 'center',
                      }}
                    >
                      <Avatar size={48} src={tech.profileImage} />
                      <div style={{ marginTop: 8 }}>{tech.name}</div>
                      <div style={{ fontSize: 12 }}>{tech.phone}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={handleCancel}>ยกเลิก</Button>
              <Button type="primary" onClick={handleAssign}>บันทึก</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CondoReport;
