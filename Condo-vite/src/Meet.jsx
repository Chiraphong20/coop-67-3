import React, { useEffect, useState } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import liff from '@line/liff'; 
import './CSS/Meet.css';

const Meet = () => {
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    room: '',
    time: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const rooms = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
  const times = [
    '08:30-10:30',
    '11:30-13:30',
    '14:00-16:00',
    '16:30-18:30',
  ];

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: '2007355122-K9ylwA67' }); 

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        setUserId(profile.userId);

        const userRef = doc(db, 'users', profile.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
          setFormData(prev => ({
            ...prev,
            name: userSnap.data().name || '',
            phone: userSnap.data().phone || '',
          }));
        } else {
          setMessage('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน');
        }
      } catch (error) {
        setMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
      }
    };

    initLiff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const checkDuplicateBooking = async () => {
    const meetCollectionRef = collection(db, 'users', userId, 'meet');
    const q = query(
      meetCollectionRef,
      where('room', '==', formData.room),
      where('time', '==', formData.time)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!userId || !userProfile) {
      setMessage('ไม่สามารถระบุผู้ใช้งานได้ กรุณาลงทะเบียนก่อน');
      setLoading(false);
      return;
    }

    try {
      const isDuplicate = await checkDuplicateBooking();
      if (isDuplicate) {
        setMessage(`ห้อง ${formData.room} ในช่วงเวลา ${formData.time} ถูกจองแล้ว`);
        setLoading(false);
        return;
      }

      const meetCollectionRef = collection(db, 'users', userId, 'meet');

      await addDoc(meetCollectionRef, {
        ...formData,
        createdAt: serverTimestamp(),
      });

      setMessage('บันทึกข้อมูลสำเร็จ');
      setFormData({ name: '', phone: '', room: '', time: '' });
    } catch (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-meett">
      <h2>จองห้องประชุม</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">ชื่อ-นามสกุล</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="phone">เบอร์โทรศัพท์</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <label htmlFor="room">ห้องประชุม</label>
        <select
          id="room"
          name="room"
          value={formData.room}
          onChange={handleChange}
          required
        >
          <option value="">-- กรุณาเลือก --</option>
          {rooms.map(room => (
            <option key={room} value={room}>{room}</option>
          ))}
        </select>

        <label htmlFor="time">ช่วงเวลาที่ต้องการใช้</label>
        <select
          id="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        >
          <option value="">-- กรุณาเลือกช่วงเวลา --</option>
          {times.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <div className="submit">
          <button
            type="button"
            className="buttoncancel"
            onClick={() => setFormData({ name: '', phone: '', room: '', time: '' })}
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button type="submit" className="buttonOK" disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Meet;
