import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload,
  message,
  Spin,
} from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

import './CSS/Announcement.css';

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      try {
        const snapshot = await getDocs(collection(db, 'announcements'));
        const list = snapshot.docs.map(doc => ({
          key: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(list);
      } catch (error) {
        message.error('โหลดประกาศล้มเหลว');
        console.error('Error fetching announcements:', error);
      }
      setLoadingAnnouncements(false);
    };
    fetchAnnouncements();
  }, []);

  const showModal = (record = null) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        title: record.title,
        detail: record.detail,
        date: moment(record.date, 'DD/MMMM/YYYY'),
      });
      setImageUrl(record.image || null);
    } else {
      form.resetFields();
      setImageUrl(null);
    }
    setIsModalOpen(true);
  };

  const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => callback(reader.result);
    reader.onerror = error => {
      message.error('แปลงรูปภาพล้มเหลว');
      console.error(error);
      setLoadingImage(false);
    };
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('คุณสามารถอัปโหลดไฟล์รูปภาพเท่านั้น!');
      return Upload.LIST_IGNORE; 
    }
    setLoadingImage(true);
    getBase64(file, (base64) => {
      setImageUrl(base64);
      setLoadingImage(false);
    });
    return false; 
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedDate = values.date.format('DD/MMMM/YYYY');

      if (editing) {
        await updateDoc(doc(db, 'announcements', editing.key), {
          title: values.title,
          detail: values.detail,
          date: formattedDate,
          image: imageUrl,
          updatedAt: serverTimestamp(),
        });

        setAnnouncements((prev) =>
          prev.map((item) =>
            item.key === editing.key
              ? { ...item, title: values.title, detail: values.detail, date: formattedDate, image: imageUrl }
              : item
          )
        );
        message.success('แก้ไขประกาศเรียบร้อย');
      } else {
        const announcementDoc = await addDoc(collection(db, 'announcements'), {
          title: values.title,
          detail: values.detail,
          date: formattedDate,
          image: imageUrl,
          createdAt: serverTimestamp(),
        });

        setAnnouncements((prev) => [
          ...prev,
          {
            key: announcementDoc.id,
            title: values.title,
            detail: values.detail,
            date: formattedDate,
            image: imageUrl,
          },
        ]);
        message.success('เพิ่มประกาศใหม่เรียบร้อย');

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        for (const user of users) {
          await addDoc(collection(db, 'notifications'), {
            userId: user.id,
            announcementId: announcementDoc.id,
            title: values.title,
            detail: values.detail,
            date: formattedDate,
            image: imageUrl,
            read: false,
            createdAt: serverTimestamp(),
          });
        }

        fetch('https://api-production-8655.up.railway.app/api/announcements/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title,
            detail: values.detail,
            date: formattedDate,
           // image: imageUrl,
            users: users.map(u => u.id),
          }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('✅ Broadcast API success:', data);
          })
          .catch(err => {
            console.error('❌ Broadcast API error:', err);
          });
      }

      setIsModalOpen(false);
      form.resetFields();
      setImageUrl(null);
      setEditing(null);
    } catch (error) {
      console.error('❌ Error saving announcement:', error);
      message.error('บันทึกประกาศล้มเหลว');
    }
  };

  const handleDelete = async (key) => {
    try {
      await deleteDoc(doc(db, 'announcements', key));
      setAnnouncements((prev) => prev.filter((item) => item.key !== key));
      message.success('ลบประกาศเรียบร้อย');
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      message.error('ลบประกาศล้มเหลว');
    }
  };

  const uploadButton = (
    <div>
      {loadingImage ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>อัปโหลดรูป</div>
    </div>
  );

const columns = [
  {
    title: 'ลำดับ',
    key: 'index',
    width: 10,
    render: (_, __, index) => index + 1, 
  },
  { title: 'คำอธิบาย', dataIndex: 'title', key: 'title', width: 10 },
  { title: 'เนื้อหา', dataIndex: 'detail', key: 'detail', width: 10 },
  { title: 'วันที่', dataIndex: 'date', key: 'date', width: 10 },
  {
    title: 'แก้ไข',
    key: 'edit',
    width: 10,
    render: (_, record) => (
      <Button
        type="primary"
        size="small"
        onClick={() => showModal(record)}
        style={{ width: '60px' }}
      >
        แก้ไข
      </Button>
    ),
  },
  {
    title: 'ลบ',
    key: 'delete',
    width: 10,
    render: (_, record) => (
      <Button
        type="primary"
        danger
        size="small"
        onClick={() => handleDelete(record.key)}
        style={{ width: '60px' }}
      >
        ลบ
      </Button>
    ),
  },
];

  return (
    <div className="announcement-container">
      <div className="header">
        <div className="search-box">
          <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" width="20" height="20" alt="search" />
          <Input placeholder="ค้นหา..." bordered={false} />
        </div>
        <p>ประกาศ</p>
        <div className="Group">
          <Button className="btn-add" type="primary" onClick={() => showModal()}>
            เพิ่มประกาศใหม่ +
          </Button>
        </div>
      </div>

      {loadingAnnouncements ? (
        <Spin tip="กำลังโหลดประกาศ..." />
      ) : (
        <Table columns={columns} dataSource={announcements} pagination={false} />
      )}

      <Modal
        title={editing ? 'แก้ไขประกาศ' : 'เพิ่มประกาศใหม่'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditing(null);
          form.resetFields();
          setImageUrl(null);
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="คำอธิบาย" rules={[{ required: true, message: 'กรุณากรอกคำอธิบาย' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="detail" label="เนื้อหา" rules={[{ required: true, message: 'กรุณากรอกเนื้อหา' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="date" label="วันที่" rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}>
            <DatePicker format="DD/MMMM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="รูปภาพประกอบ">
            <Upload
              name="image"
              listType="picture-card"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onRemove={() => setImageUrl(null)}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="uploaded" style={{ width: '100%' }} />
              ) : (
                uploadButton
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Announcement;
