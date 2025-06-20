import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Dropdown,
  Menu,
  Modal,
  message,
  Upload,
  Input,
  Form,
  Spin,
  DatePicker
} from 'antd';
import { EllipsisOutlined, UploadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import './CSS/Staff.css';


const Staff = () => {
  const [dataSource, setDataSource] = useState([]);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(false); 


  useEffect(() => {
  const fetchTechnicians = async () => {
          setLoading(true); 

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'technician'));
      const querySnapshot = await getDocs(q);
      const techniciansData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          key: docSnap.id,
          pic: data.profileImage || '',
          name: data.name || '-',
          tel: data.phone || data.tel || '-',
          status: data.status || 'ยังไม่ได้มอบหมายงาน',
          date: data.date || moment().format('DD/MM/YYYY'),
          ...data,
        };
      });
      setDataSource(techniciansData);
    } catch (error) {
      console.error('โหลดข้อมูลช่างล้มเหลว:', error);
      message.error('โหลดข้อมูลช่างล้มเหลว');
    }
  };
  fetchTechnicians();
}, []);


  const showAssignModal = (record) => {
    setSelectedRecord(record);
    assignForm.resetFields();
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      const userDocRef = doc(db, 'users', selectedRecord.key);
      await updateDoc(userDocRef, {
        status: 'มอบหมายงานแล้ว',
        assignTask: {
          title: values.title,
          details: values.details,
          duration: values.duration.format('DD/MM/YYYY'),
          file: values.file || [],
        },
      });
      setDataSource(prev =>
        prev.map(item =>
          item.key === selectedRecord.key
            ? { ...item, status: 'มอบหมายงานแล้ว', assignTask: values }
            : item
        )
      );
      setIsAssignModalOpen(false);
      message.success('มอบหมายงานสำเร็จ');
      assignForm.resetFields();
    } catch (error) {
      console.log('Error assign task:', error);
    }
  };

  const showEditModal = (record) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      name: record.name,
      tel: record.tel,
      date: record.date ? moment(record.date, 'DD/MM/YYYY') : null,
      profilePic: record.profilePic || [],
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const updated = {
        ...values,
        date: values.date.format('DD/MM/YYYY'),
      };

      const userDocRef = doc(db, 'users', selectedRecord.key);
      await updateDoc(userDocRef, {
        name: updated.name,
        phone: updated.tel,
        date: updated.date,
        profilePic: updated.profilePic || [],
      });

      setDataSource(prev =>
        prev.map(item =>
          item.key === selectedRecord.key
            ? { ...item, ...updated }
            : item
        )
      );
      setIsEditModalOpen(false);
      message.success('แก้ไขข้อมูลสำเร็จ');
      form.resetFields();
    } catch (error) {
      console.log('Error edit staff:', error);
    }
  };

  const confirmDelete = (key) => {
    Modal.confirm({
      title: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          // ลบข้อมูลจาก Firestore
          // import { deleteDoc } from 'firebase/firestore' ถ้าจะลบจริง
          // await deleteDoc(doc(db, 'users', key));
          // สำหรับ demo ลบใน UI ก่อน
          setDataSource(prev => prev.filter(item => item.key !== key));
          message.success('ลบข้อมูลเรียบร้อยแล้ว');
        } catch (error) {
          console.log('Error deleting user:', error);
          message.error('ลบข้อมูลไม่สำเร็จ');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ลำดับ',
      dataIndex: 'key',
      render: (_, __, index) => index + 1,
    },
    {
    title: 'รูปโปรไฟล์',
    dataIndex: 'pic',
    key: 'pic',
    render: (pic) =>
      pic ? (
        <img
          src={pic}
          alt="profile"
          style={{ width: 40, height: 40, borderRadius: '50%' }}
        />
      ) : (
        '-'
      ),
  },
    {
      title: 'ชื่อ',
      dataIndex: 'name',
    },
    {
      title: 'เบอร์โทรติดต่อ',
      dataIndex: 'tel',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      render: (status) => (
        <span style={{ color: status === 'มอบหมายงานแล้ว' ? 'red' : 'green' }}>
          {status}
        </span>
      ),
    },
    {
      title: 'วันจ้างงาน',
      dataIndex: 'date',
    },
    {
      title: 'อื่นๆ',
      key: 'actions',
      render: (_, record) => {
        const menu = (
          <Menu
            onClick={({ key }) => {
              if (key === 'manage') showAssignModal(record);
              else if (key === 'edit') showEditModal(record);
              else if (key === 'delete') confirmDelete(record.key);
            }}
            items={[
              { key: 'edit', label: 'แก้ไข' },
              { key: 'delete', label: 'ลบ', danger: true },
            ]}
          />
        );
        return (
          <Dropdown overlay={menu} trigger={['click']}>
            <Button shape="circle" icon={<EllipsisOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
   <div className="staff-container">
 <div className="header">
  <div className="spacer" /> {/* เผื่อไว้สำหรับปุ่มซ้าย */}
  <p className="title-staff">จัดการพนักงาน</p>
  <div className="spacer" /> {/* เผื่อไว้สำหรับปุ่มขวา */}
</div>
  <Table columns={columns} dataSource={dataSource} pagination={false} />

      {/* Modal มอบหมายงาน */}
      <Modal
        title="มอบหมายงาน"
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        onOk={handleAssignSubmit}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        width={600}
      >
        <Form layout="vertical" form={assignForm}>
          <Form.Item
            name="title"
            label="หัวข้องาน"
            rules={[{ required: true, message: 'กรุณากรอกหัวข้องาน' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="details"
            label="รายละเอียดงาน"
            rules={[{ required: true, message: 'กรุณากรอกรายละเอียด' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="duration"
            label="ระยะเวลา"
            rules={[{ required: true, message: 'กรุณากรอกระยะเวลา' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="file"
            label="ไฟล์แนบ"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} listType="picture-card">
              <div>
                <UploadOutlined />
                <div>โปรดเลือกไฟล์</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal แก้ไขพนักงาน */}
      <Modal
        title="แก้ไขข้อมูลพนักงาน"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={handleEditSubmit}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        width={500}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="ชื่อ"
            rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="tel"
            label="เบอร์โทร"
            rules={[{ required: true, message: 'กรุณากรอกเบอร์โทร' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="date"
            label="วันจ้างงาน"
            rules={[{ required: true, message: 'กรุณาเลือกวันจ้างงาน' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="profilePic"
            label="รูปโปรไฟล์แนบ"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} listType="picture-card">
              <div>
                <UploadOutlined />
                <div>โปรดเลือกไฟล์</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Staff;
