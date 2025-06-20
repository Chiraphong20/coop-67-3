import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, Spin } from 'antd';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './CSS/CondoMeet.css';

const { Option } = Select;

const CondoMeet = () => {
  const [bookings, setBookings] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true); 
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        let allBookings = [];

        for (const userDoc of usersSnapshot.docs) {
          const meetRef = collection(db, 'users', userDoc.id, 'meet');
          const meetSnapshot = await getDocs(meetRef);

          meetSnapshot.forEach(doc => {
            allBookings.push({
              id: doc.id,
              userId: userDoc.id,
              ...doc.data(),
            });
          });
        }

        setBookings(allBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
      setLoading(false); 
    };

    fetchBookings();
  }, []);

  const handleRoomClick = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className='custom-content-meet'>
     <div className="meeting-container">
  <div className="header">
    <div className="spacer" />
    <p className="title">จองห้องประชุม</p>
    <div className="spacer" />
  </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <Spin size="large" tip="กำลังโหลดข้อมูล..." />
          </div>
        ) : (
          <div className="room-grid">
            {bookings.length === 0 && <p>ไม่มีการจองห้องประชุมในขณะนี้</p>}
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="room-card booked"
                onClick={() => handleRoomClick(booking)}
              >
                <div className="time">{booking.time}</div>
                <div className="room-id">{booking.room}</div>
                <div>{booking.name}</div>
                <div>เบอร์: {booking.phone}</div>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={modalOpen}
          onCancel={handleCancel}
          footer={[
            <Button key="back" onClick={handleCancel}>ยกเลิก</Button>,
            <Button key="submit" type="primary" style={{ backgroundColor: '#00c896' }}>ยืนยัน</Button>,
          ]}
          centered
        >
          {selectedBooking && (
            <div className="modal-content">
              <p><strong>ชื่อ–นามสกุล</strong><br />{selectedBooking.name}</p>
              <p><strong>เบอร์โทร</strong><br />{selectedBooking.phone}</p>
              <p><strong>เวลาที่จอง</strong><br />{selectedBooking.time}</p>
              <p><strong>สถานะห้อง</strong><br />
                <Select defaultValue="ไม่ว่าง" style={{ width: 120 }}>
                  <Option value="ไม่ว่าง">🔴 ไม่ว่าง</Option>
                  <Option value="ว่าง">🟢 ว่าง</Option>
                </Select>
              </p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CondoMeet;
