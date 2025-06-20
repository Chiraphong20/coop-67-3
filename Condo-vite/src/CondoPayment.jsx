import React, { useEffect, useState } from 'react';
import { Input, Button, Modal, Form, Select, DatePicker, message, Tabs } from 'antd';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  query,
  orderBy,
  limit,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import './CSS/CondoPayment.css';

const { Option } = Select;

const CondoPayment = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [rooms, setRooms] = useState([]);
  const [registeredRooms, setRegisteredRooms] = useState([]);
  const [roomUidMap, setRoomUidMap] = useState({});
  const [roomUserDataMap, setRoomUserDataMap] = useState({});
  const [paymentSuccessRoom, setPaymentSuccessRoom] = useState(null); 

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userSnap = await getDocs(collection(db, 'users'));
        const roomsList = [];
        const uidMap = {};
        const userDataMap = {};
        const tempRooms = [];

        for (const userDoc of userSnap.docs) {
          const userData = userDoc.data();
          const uid = userDoc.id;

          if (userData.room) {
            roomsList.push(userData.room);
            uidMap[userData.room] = uid;
            userDataMap[userData.room] = userData;

            const paymentsSnap = await getDocs(
              query(collection(db, 'users', uid, 'payments'), orderBy('dueDate', 'desc'))
            );

            paymentsSnap.forEach((paymentDoc) => {
              const payment = paymentDoc.data();
              tempRooms.push({
                room: userData.room,
                name: userData.name || `ห้อง ${userData.room}`,
                phone: userData.phone || 'ไม่ทราบ',
                billType: payment.billType,
                amount: payment.amount,
                status: payment.status || 'ยังไม่ชำระ',
                dueDate: payment.dueDate?.toDate ? payment.dueDate.toDate() : null,
                billingCycle: payment.billingCycle || '',
              });
            });
          }
        }

        setRegisteredRooms(roomsList);
        setRoomUidMap(uidMap);
        setRoomUserDataMap(userDataMap);
        setRooms(tempRooms);
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        message.error('โหลดข้อมูลล้มเหลว');
      }
    };

    fetchData();
  }, []);

  const handlePay = async (roomData) => {
    const uid = roomUidMap[roomData.room];
    if (!uid) {
      message.error('ไม่พบผู้ใช้สำหรับห้องนี้');
      return;
    }

    try {
      const paymentsRef = collection(db, 'users', uid, 'payments');
      const paymentQuery = query(paymentsRef, orderBy('dueDate', 'desc'), limit(10));
      const paymentDocs = await getDocs(paymentQuery);

      let paymentDocId = null;
    paymentDocs.forEach((docSnap) => {
  const data = docSnap.data();
  console.log('🔥 ตรวจสอบข้อมูล:', {
    จากฐานข้อมูล: data,
    จากหน้าจอ: roomData
  });

if (
  data.billType === roomData.billType &&
  data.status !== 'ชำระแล้ว' &&
  Math.abs(data.amount - roomData.amount) < 0.01 
) {
  paymentDocId = docSnap.id;
}

});


      if (!paymentDocId) {
        message.error('ไม่พบบิลที่ยังไม่ชำระ');
        return;
      }

      const paymentDocRef = doc(db, 'users', uid, 'payments', paymentDocId);

      await updateDoc(paymentDocRef, {
        status: 'ชำระแล้ว',
        paidDate: new Date(),
      });

      Modal.success({
        title: 'ชำระเงินเสร็จเรียบร้อยแล้ว',
        content: `คุณได้ชำระเงินสำหรับห้อง ${roomData.room} เรียบร้อยแล้ว`,
      });

      setPaymentSuccessRoom(roomData.room);
      setTimeout(() => setPaymentSuccessRoom(null), 5000); 

      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.room === roomData.room &&
          r.billType === roomData.billType &&
          r.amount === roomData.amount
            ? { ...r, status: 'ชำระแล้ว' }
            : r
        )
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error('เกิดข้อผิดพลาดในการชำระเงิน');
    }
  };

  const handleAddRoom = async (values) => {
    const roomNumber = values.roomNumber;
    const uid = roomUidMap[roomNumber];
    const userData = roomUserDataMap[roomNumber];

    if (!uid || !userData) {
      message.error('ไม่พบผู้ใช้ที่ลงทะเบียนห้องนี้');
      return;
    }

    const newPayment = {
      room: roomNumber,
      name: userData.name,
      phone: userData.phone || 'ไม่ทราบ',
      billType: values.billType,
      amount: values.amount,
      billingCycle: values.billingCycle.format('MMMM YYYY'),
      dueDate: values.dueDate.toDate(),
      status: 'ยังไม่ชำระ',
    };

    try {
      await addDoc(collection(db, 'users', uid, 'payments'), newPayment);
      message.success('บันทึกข้อมูลเรียบร้อย');
      setRooms((prevRooms) => [...prevRooms, newPayment]);
      form.resetFields();
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      message.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleDelete = () => {
    setRooms((prev) => prev.slice(0, -1));
    setModalVisible(false);
  };

  return (
    <div className="content-payment">
      {paymentSuccessRoom && (
        <div className="success-banner">
          ✅ ชำระเงินสำหรับห้อง {paymentSuccessRoom} เสร็จเรียบร้อยแล้ว
        </div>
      )}

      <div className="sectionheader">
        <div className="search-box">
          <img
            src="https://cdn-icons-png.flaticon.com/512/54/54481.png"
            width="20"
            height="20"
            alt="search"
          />
          <Input placeholder="ค้นหา..." bordered={false} />
        </div>
        <p>คนที่ค้างชำระ</p>
        <div className="Group">
          <Button  className="btn-add"  onClick={() => openModal('add')}>
            แจ้งยอดชำระ +
          </Button>
    
        </div>
      </div>

      <Tabs defaultActiveKey="unpaid" className="custom-tabs">
      <Tabs.TabPane tab="คนที่ค้างชำระ" key="unpaid" className="tab-unpaid">
          <div className="room-section">
            {rooms
              .filter((room) => room.status === 'ยังไม่ชำระ')
              .map((room, index) => (
                <div key={index} className="room-card">
                  <div className="status-label">
                    <span className="red-dot" />
                    <span className="status-text">{room.status}</span>
                  </div>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/6001/6001179.png"
                    alt="building"
                    style={{ width: 60, margin: '10px 0' }}
                  />
                  <div><b>{room.name}</b></div>
                  <div><b>เบอร์ : {room.phone}</b></div>
                  <div><b>ห้อง {room.room}</b></div>
                  <div><b>{room.billType} : {room.amount} บาท</b></div>
                  <Button type="primary" size="small" onClick={() => handlePay(room)}>
                    ชำระเงิน
                  </Button>
                </div>
              ))}
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="ประวัติชำระแล้ว" key="paid" className="tab-paid">
          <div className="room-section">
            {rooms
              .filter((room) => room.status === 'ชำระแล้ว')
              .map((room, index) => (
                <div key={index} className="room-card paid">
                  <div className="status-label-paid">
                    <span className="green-dot" />
                    <span className="status-text">{room.status}</span>
                  </div>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/6001/6001179.png"
                    alt="building"
                    style={{ width: 60, margin: '10px 0' }}
                  />
                  <div><b>{room.name}</b></div>
                  <div><b>เบอร์ : {room.phone}</b></div>
                  <div><b>ห้อง {room.room}</b></div>
                  <div><b>{room.billType} : {room.amount} บาท</b></div>
                  <div><b>รอบเดือน : {room.billingCycle}</b></div>
                </div>
              ))}
          </div>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title={
          modalType === 'add'
            ? 'แจ้งยอดชำระ'
            : modalType === 'edit'
            ? 'แก้ไขข้อมูล'
            : modalType === 'delete'
            ? 'ยืนยันการลบ'
            : ''
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {modalType === 'add' && (
          <Form layout="vertical" onFinish={handleAddRoom} form={form}>
            <Form.Item label="ห้องที่" name="roomNumber" rules={[{ required: true }]}>
              <Select placeholder="เลือกห้อง">
                {registeredRooms.map((room) => (
                  <Option key={room} value={room}>{room}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="ประเภทบิล" name="billType" rules={[{ required: true }]}>
              <Select placeholder="เลือกประเภทบิล">
                <Option value="ค่าน้ำ">ค่าน้ำ</Option>
                <Option value="ค่าไฟ">ค่าไฟ</Option>
                <Option value="ค่าส่วนกลาง">ค่าส่วนกลาง</Option>
              </Select>
            </Form.Item>

            <Form.Item label="ยอดชำระ" name="amount" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>

            <Form.Item label="รอบเดือน" name="billingCycle" rules={[{ required: true }]}>
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="วันกำหนดชำระ" name="dueDate" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <div className="modal-buttons">
              <Button onClick={() => setModalVisible(false)} className="cancel">
                ยกเลิก
              </Button>
              <Button htmlType="submit" type="primary" className="save">
                บันทึก
              </Button>
            </div>
          </Form>
        )}

        {modalType === 'edit' && <p>ฟอร์มแก้ไข (กำลังพัฒนา)</p>}

        {modalType === 'delete' && (
          <>
            <p>คุณต้องการลบข้อมูลล่าสุดใช่หรือไม่?</p>
            <div className="modal-buttons">
              <Button onClick={() => setModalVisible(false)} className="cancel">
                ยกเลิก
              </Button>
              <Button onClick={handleDelete} type="primary" danger>
                ลบ
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CondoPayment;
