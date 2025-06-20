import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  message,
  Upload,
  Input,
  Form,
  DatePicker,
  Popconfirm
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

const Income = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const ref = collection(db, 'incomes');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map((docSnap, index) => ({
          key: docSnap.id,
          index: index + 1,
          ...docSnap.data()
        }));
        setDataSource(data);
      } catch (error) {
        console.error('โหลดข้อมูลล้มเหลว:', error);
        message.error('โหลดข้อมูลล้มเหลว');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const openAddModal = () => {
    form.resetFields();
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setIsEdit(true);
    setEditingRecord(record);
    const imageList = (record.image || []).map((base64, index) => ({
      uid: index,
      name: `image-${index}`,
      status: 'done',
      url: base64
    }));
    form.setFieldsValue({
      description: record.description,
      date: moment(record.date, 'DD/MM/YYYY'),
      image: imageList,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (key) => {
    try {
      await deleteDoc(doc(db, 'incomes', key));
      setDataSource(prev =>
        prev.filter(item => item.key !== key).map((item, idx) => ({ ...item, index: idx + 1 }))
      );
      message.success('ลบข้อมูลสำเร็จ');
    } catch (error) {
      console.error('ลบไม่สำเร็จ:', error);
      message.error('ลบข้อมูลไม่สำเร็จ');
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj || file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj || file);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || 'รูปภาพ');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let imageBase64List = [];

      if (values.image && values.image.length > 0) {
        imageBase64List = await Promise.all(
          values.image.map(file => getBase64(file))
        );
      }

      const payload = {
        description: values.description,
        date: values.date.format('DD/MM/YYYY'),
        image: imageBase64List,
      };

      if (isEdit && editingRecord) {
        await updateDoc(doc(db, 'incomes', editingRecord.key), payload);
        setDataSource(prev =>
          prev.map(item =>
            item.key === editingRecord.key ? { ...item, ...payload } : item
          )
        );
        message.success('แก้ไขข้อมูลสำเร็จ');
      } else {
        const docRef = await addDoc(collection(db, 'incomes'), payload);
        setDataSource(prev => [
          ...prev,
          { key: docRef.id, ...payload, index: prev.length + 1 }
        ]);
        message.success('เพิ่มข้อมูลสำเร็จ');
      }

      form.resetFields();
      setIsModalOpen(false);
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      message.error('บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const columns = [
    {
      title: 'ลำดับ',
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: 'คำอธิบาย',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'รูปภาพ',
      dataIndex: 'image',
      key: 'image',
      render: (imgList) =>
        imgList && imgList.length > 0 ? (
          <img
            src={imgList[0]}
            alt="uploaded"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => {
              setPreviewImage(imgList[0]);
              setPreviewTitle('รูปภาพ');
              setPreviewVisible(true);
            }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            แก้ไข
          </Button>
          <Popconfirm
            title="คุณแน่ใจหรือไม่ว่าต้องการลบ?"
            onConfirm={() => handleDelete(record.key)}
            okText="ใช่"
            cancelText="ไม่"
          >
            <Button icon={<DeleteOutlined />} danger>
              ลบ
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
  <div style={{ padding: '24px 16px', width: '100%', boxSizing: 'border-box' }}>
    <div className="header">
      <div className="spacer" />
      <p className="page-title">แจ้งยอดรายรับ-รายจ่าย</p>
      <div className="spacer" />
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={openAddModal}
      >
        เพิ่มข้อมูล
      </Button>
    </div>

    <Table
  dataSource={dataSource}
  columns={columns}
  loading={loading}
  pagination={false}
  scroll={{ x: '100%' }}
  style={{ width: '100%' }}
/>

    <Modal
      title={isEdit ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล'}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      onOk={handleSubmit}
      okText="ยืนยัน"
      cancelText="ยกเลิก"
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="description"
          label="คำอธิบาย"
          rules={[{ required: true, message: 'กรุณากรอกคำอธิบาย' }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="date"
          label="วันที่"
          rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="image"
          label="อัพโหลดรูปภาพ"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
        >
          <Upload
            beforeUpload={() => false}
            listType="picture-card"
            onPreview={handlePreview}
          >
            <div>
              <UploadOutlined />
              <div>อัพโหลด</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      visible={previewVisible}
      title={previewTitle}
      footer={null}
      onCancel={() => setPreviewVisible(false)}
    >
      <img alt="preview" style={{ width: '100%' }} src={previewImage} />
    </Modal>
  </div>
);

};

export default Income;