import React, { useState, useEffect } from 'react';
import './CSS/machanicstatus.css';
import { Image, Select, Input, Upload, message, Modal, DatePicker, Button, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import imageCompression from 'browser-image-compression';

const { TextArea } = Input;

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) message.error('รองรับเฉพาะไฟล์รูปภาพ');
  if (!isLt5M) message.error('ขนาดไฟล์ต้องไม่เกิน 5MB');

  return isImage && isLt5M;
};

const compressAndConvertToBase64 = async (file) => {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (err) {
    console.error('การบีบอัดผิดพลาด:', err);
    return null;
  }
};

const Machanicstatus = () => {
  const { userId, taskId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    room: '', name: '', topic: '', details: '',
    phone: '', imageUrl: '', status: '',
    mechanicDate: null, repairImages: [],
  });

  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (!userId || !taskId) return;

    const fetchTaskData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', userId, 'assignedTasks', taskId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            room: data.room || data.userInfo?.room || '',
            name: data.name || data.userInfo?.name || '',
            topic: data.title || data.topic || '',
            details: data.description || data.detail || '',
            phone: data.phone || data.userInfo?.phone || '',
            imageUrl: data.media || data.imageUrl || '',
            status: data.status || '',
            mechanicDate: data.mechanicDate || null,
            repairImages: data.repairImages || [],
          });
        } else {
          message.error('ไม่พบข้อมูลงานนี้');
          navigate(-1);
        }
      } catch (error) {
        console.error('โหลดข้อมูลผิดพลาด', error);
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [userId, taskId, navigate]);

  const handleStatusChange = (value) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleDateChange = (date, dateString) => {
    setFormData(prev => ({ ...prev, mechanicDate: dateString }));
  };

  const handleImageChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const base64Images = [];

      for (const file of fileList) {
        const originFile = file.originFileObj;
        if (originFile) {
          const base64 = await compressAndConvertToBase64(originFile);
          if (base64) base64Images.push(base64);
        }
      }

      const taskRef = doc(db, 'users', userId, 'assignedTasks', taskId);
      await updateDoc(taskRef, {
        status: formData.status,
        mechanicDate: formData.mechanicDate,
        repairImages: base64Images,
      });

      setIsModalVisible(true);
    } catch (error) {
      console.error('อัปโหลดผิดพลาด', error);
      message.error('เกิดข้อผิดพลาดในการอัปโหลด/บันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
    setIsModalVisible(false);
    navigate(-1);
  };

  const handleCancel = () => navigate(-1);

  const statusOptions = [
    { value: 'ซ่อมแซมเสร็จสิ้น', label: <span style={{ color: 'green' }}>ซ่อมแซมเสร็จสิ้น</span> },
    { value: 'ไม่สามารถซ่อมแซมได้', label: <span style={{ color: 'red' }}>ไม่สามารถซ่อมแซมได้</span> },
    { value: 'รออะไหล่ซ่อมแซม', label: <span style={{ color: '#faad14' }}>รออะไหล่ซ่อมแซม</span> },
  ];

  return (
    <div className="container-machanicstatus">
      <h2>อัปเดตสถานะคำสั่งซ่อม</h2>
      <Spin spinning={loading}>
        <form onSubmit={handleSubmit}>
          <label>เลขห้อง</label>
          <Input value={formData.room} disabled />

          <label>ชื่อ-นามสกุล</label>
          <Input value={formData.name} disabled />

          <label>หัวข้อ</label>
          <Input value={formData.topic} disabled />

          <label>รายละเอียด</label>
          <TextArea value={formData.details} disabled rows={4} />

          <label>เบอร์โทรศัพท์</label>
          <Input value={formData.phone} disabled />

          <label>ภาพจากลูกบ้าน</label>
          <div style={{ margin: '20px 0' }}>
            {formData.imageUrl && <Image width={200} src={formData.imageUrl} alt="รูปจากลูกบ้าน" />}
          </div>

          <label>วันที่จะเข้าซ่อม</label>
          <DatePicker
            style={{ width: '100%', marginBottom: 16 }}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            value={formData.mechanicDate ? dayjs(formData.mechanicDate) : null}
          />

          <label>สถานะ</label>
          <Select
            showSearch
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="เลือกสถานะ"
            value={formData.status}
            onChange={handleStatusChange}
            options={statusOptions}
          />

          <label>อัปโหลดรูปภาพหลังซ่อม</label>
          <Upload
            name="image"
            listType="picture-card"
            multiple
            showUploadList
            fileList={fileList}
            onChange={handleImageChange}
            beforeUpload={beforeUpload}
            accept="image/*"
            maxCount={8}
          >
            {fileList.length >= 8 ? null : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>เพิ่มรูป</div>
              </div>
            )}
          </Upload>

          {formData.repairImages.length > 0 && (
            <>
              <label>รูปภาพที่บันทึกไว้:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {formData.repairImages.map((img, index) => (
                  <Image key={index} src={img} width={120} />
                ))}
              </div>
            </>
          )}

          <div className="submit" style={{ marginTop: 20 }}>
            <button type="button" className="buttoncancel" onClick={handleCancel}>ยกเลิก</button>
            <button type="submit" className="buttonOK" disabled={loading}>ยืนยัน</button>
          </div>
        </form>
      </Spin>

      <Modal
        title="บันทึกข้อมูล"
        open={isModalVisible}
        closable={false}
        footer={[
          <button key="ok" className="buttonOK" onClick={handleOk}>กลับ</button>,
        ]}
      >
        <p>บันทึกเสร็จสิ้นแล้ว</p>
      </Modal>
    </div>
  );
};

export default Machanicstatus;
