import React, { useState, useEffect } from 'react';
import { Input, Button, Modal, Form } from 'antd';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import './CSS/CondoRoom.css';

const CondoRoom = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]); 
  const [searchText, setSearchText] = useState(''); 
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form] = Form.useForm();

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userData = querySnapshot.docs
        .map(doc => ({
          ...doc.data(),
          id: doc.id,
        }))
        .filter(user => user.role !== 'technician'); 

      setRooms(userData);
      setFilteredRooms(userData);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
    }
  };

  fetchUsers();
}, []);


const handleSearch = (e) => {
  const text = e.target.value.toLowerCase();
  setSearchText(text);

  const filtered = rooms.filter(room =>
    (room.name && room.name.toLowerCase().includes(text)) ||
    (room.room && room.room.toLowerCase().includes(text)) ||
    (room.phone && room.phone.toLowerCase().includes(text))
  );
  setFilteredRooms(filtered);
};
  const handleAddRoom = async (values) => {
    const newRoom = {
      room: values.roomNumber,
      name: values.residentName,
      phone: values.phone,
      uid: values.uid || '',
      moveInDate: values.moveInDate || '',
    };

    try {
      await addDoc(collection(db, 'users'), newRoom);
      const updatedRooms = [...rooms, newRoom];
      setRooms(updatedRooms);
      setFilteredRooms(updatedRooms);
      form.resetFields();
      setModalVisible(false);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มห้อง:', err);
    }
  };

  const showRoomDetail = (room) => {
    setSelectedRoom(room);
    setDetailVisible(true);
  };

  return (
    <div className="content-room">
      <div className="sectionheader">
        <div className="search-box">
          <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" width="20" height="20" alt="search" />
          <Input
            placeholder="ค้นหา... (ชื่อ ห้อง เบอร์..)"
            bordered={false}
            value={searchText}
            onChange={handleSearch}
          />
        </div>
        <p>ข้อมูลห้อง</p>
      </div>

      <div className="room-section">
        {filteredRooms.map((room, index) => (
          <div
            key={index}
            className="room-card"
            onClick={() => showRoomDetail(room)}
            style={{ cursor: 'pointer' }}
          >
            <img src="https://cdn-icons-png.flaticon.com/512/6001/6001179.png" alt="avatar" />
            <div>{room.name}</div>
            <div>เบอร์ : {room.phone}</div>
            <b>ห้อง {room.room}</b>
          </div>
        ))}
      </div>

      <Modal
        title={<span style={{ color: 'black' }}>รายละเอียดผู้พักอาศัย</span>}
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)} style={{ color: 'black' }}>
            ปิด
          </Button>,
        ]}
      >
        {selectedRoom && (
          <div className="repair-raa" style={{ color: 'black' }}>
            <p><strong>ชื่อ:</strong> {selectedRoom.name}</p>
            <p><strong>เบอร์โทร:</strong> {selectedRoom.phone}</p>
            <p><strong>ตึก:</strong> {selectedRoom.building || '-'}</p>
            <p><strong>ห้อง:</strong> {selectedRoom.room}</p>
            <p><strong>อีเมล์:</strong> {selectedRoom.email || '-'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CondoRoom;
