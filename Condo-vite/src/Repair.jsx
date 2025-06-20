import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, Tabs, Typography, message, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { db } from './firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import liff from '@line/liff';
import imageCompression from 'browser-image-compression';
import './CSS/Repair.css';
import repairIcon from './assets/repair-icon.png';
import complaintIcon from './assets/complaint-icon.png';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

function Repair() {
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: '2007355122-N49L86B2' });

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
        } else {
          message.warning('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน');
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล LINE: ' + error.message);
      }
    };

    initLiff();
  }, []);

  const beforeUpload = (file) => {
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
    }
    return isLt5M || Upload.LIST_IGNORE;
  };

  const compressAndConvertToBase64 = async (file) => {
    try {
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
      }
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
      });
    } catch (err) {
      console.error('Error compressing:', err);
      return null;
    }
  };

  const handleSubmit = async (values, type) => {
    if (!userId || !userProfile) {
      message.warning('ไม่สามารถระบุผู้ใช้งานได้ กรุณาลงทะเบียนก่อน');
      return;
    }

    setLoading(true);

    const { title, description, upload } = values;

    let base64Data = null;
    if (upload && upload[0]?.originFileObj) {
      base64Data = await compressAndConvertToBase64(upload[0].originFileObj);
    }

    const userInfo = {
      name: userProfile.name || '',
      phone: userProfile.phone || '',
      email: userProfile.email || '',
      role: userProfile.role || '',
      room: userProfile.room || '',
      building: userProfile.building || '',
      userId,
    };

    try {
      const mainCollectionRef = collection(db, 'users', userId, type);
      const mainDocRef = await addDoc(mainCollectionRef, {
        title,
        description,
        type,
        userInfo,
        createdAt: serverTimestamp(),
        media: base64Data || null,
        mediaType: upload?.[0]?.type || null,
        mediaName: upload?.[0]?.name || null,
      });

      const assignedTasksRef = collection(db, 'users', userId, 'assignedTasks');
      await addDoc(assignedTasksRef, {
        taskId: mainDocRef.id,
        title,
        description,
        type,
        status: 'ยังไม่ได้ดำเนินการ',
        userInfo,
        createdAt: serverTimestamp(),
        media: base64Data || null,
        mediaType: upload?.[0]?.type || null,
        mediaName: upload?.[0]?.name || null,
      });

      message.success('✅ ส่งข้อมูลสำเร็จ');
    } catch (error) {
      console.error('❌ Error:', error);
      message.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-report-m">

      <Title level={4} style={{ textAlign: 'center', color: 'white' }}>แจ้งซ่อม / ร้องเรียน</Title>
      <Tabs defaultActiveKey="repair" centered>
        {['repair', 'complaint'].map((type) => (
          <TabPane
            key={type}
            tab={
              <div className="tab-icon" style={{ color: 'white' }}>
                <img src={type === 'repair' ? repairIcon : complaintIcon} alt={type} />
                <div className="repair-label">{type === 'repair' ? 'แจ้งซ่อม' : 'ร้องเรียน'}</div>
              </div>
            }
          >
            <Spin spinning={loading}>
              <Form layout="vertical" onFinish={(v) => handleSubmit(v, type)}>
                <Form.Item name="title" label="หัวข้อ" rules={[{ required: true, message: 'กรุณาเลือกหัวข้อ' }]}>
                  <Select placeholder={`เลือก${type === 'repair' ? 'ประเภทการซ่อม' : 'หัวข้อร้องเรียน'}`}>
                    {type === 'repair' ? (
                      <>
                        <Option value="ซ่อมประตู">ซ่อมประตู</Option>
                        <Option value="ไฟฟ้า">ไฟฟ้า</Option>
                        <Option value="ประปา">ประปา</Option>
                      </>
                    ) : (
                      <>
                        <Option value="นิติบุคคลไม่ให้ความร่วมมือ">นิติบุคคลไม่ให้ความร่วมมือ</Option>
                        <Option value="พฤติกรรมเพื่อนบ้าน">พฤติกรรมเพื่อนบ้าน</Option>
                        <Option value="อื่น ๆ">อื่น ๆ</Option>
                      </>
                    )}
                  </Select>
                </Form.Item>

                <Form.Item name="description" label="คำอธิบายเพิ่มเติม" rules={[{ required: true }]}>
                  <TextArea rows={5} placeholder="อธิบายปัญหา..." />
                </Form.Item>

                <Form.Item
                  name="upload"
                  label="อัปโหลดวิดีโอ / รูปภาพ"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => e.fileList}
                >
                  <Upload beforeUpload={beforeUpload} accept="image/*,video/*" maxCount={1}>
                    <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
                  </Upload>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    {type === 'repair' ? 'ส่งแจ้งซ่อม' : 'ส่งเรื่องร้องเรียน'}
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

export default Repair;
