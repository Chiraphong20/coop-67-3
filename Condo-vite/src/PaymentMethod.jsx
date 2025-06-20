import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Spin, message, Radio } from 'antd';
import './CSS/PaymentMethod.css';

import qrIcon from './assets/qr.png';
import nextIcon from './assets/next.png';
import scbIcon from './assets/scb.png';
import bblIcon from './assets/bbl.png';
import kmaIcon from './assets/kma.png';
import kplusIcon from './assets/kplus.png';

const PaymentMethod = () => {
  const { id } = useParams(); 
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const navigate = useNavigate();

  const paymentMethods = [
    { label: 'ชำระด้วย QR', value: 'qr', icon: qrIcon },
    { label: 'NEXT', value: 'next', icon: nextIcon },
    { label: 'SCB EASY', value: 'scb', icon: scbIcon },
    { label: 'BualuangM', value: 'bbl', icon: bblIcon },
    { label: 'KMA', value: 'kma', icon: kmaIcon },
    { label: 'K PLUS', value: 'kplus', icon: kplusIcon },
  ];

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const uid = localStorage.getItem('userId');
        if (!uid) throw new Error('ไม่พบข้อมูลผู้ใช้');

        const billRef = doc(db, 'users', uid, 'payments', id);
        const billSnap = await getDoc(billRef);

        if (billSnap.exists()) {
          setBill(billSnap.data());
        } else {
          message.error('ไม่พบข้อมูลบิล');
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาด: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [id]);

  const handlePayment = async () => {
    if (!selectedMethod) {
      message.warning('กรุณาเลือกช่องทางการชำระเงิน');
      return;
    }

    setPaying(true);
    try {
      const uid = localStorage.getItem('userId');
      const billRef = doc(db, 'users', uid, 'payments', id);

      await updateDoc(billRef, {
        status: 'ชำระแล้ว',
        paidDate: new Date(),
        paymentMethod: selectedMethod,
      });

      message.success('ชำระเงินสำเร็จ');
      navigate('/my-bills'); 
    } catch (error) {
      message.error('ชำระเงินไม่สำเร็จ: ' + error.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Spin tip="กำลังโหลดข้อมูลบิล..." style={{ marginTop: 50 }} />;

  if (!bill) return <div>ไม่พบข้อมูลบิล</div>;

  return (
    <div className='wrapper-bank'>
    <div className="payment-container-bank">
      <div className="payment-header">
        <span className="close-btn" onClick={() => navigate(-1)}>×</span>
        <p>เลือกช่องทางการชำระเงิน</p>
      </div>



      <Radio.Group
        onChange={e => setSelectedMethod(e.target.value)}
        value={selectedMethod}
        disabled={paying}
        className="payment-options"
      >
      {paymentMethods.map((method) => (
  <Radio key={method.value} value={method.value} className="payment-option">
    <div className="payment-left">
      <img
        src={method.icon}
        alt={method.label}
        style={{ width: 24, height: 24, objectFit: 'contain', marginRight: 8 }}
      />
      <span style={{ color: method.color }}>{method.label}</span>
    </div>
  </Radio>
))}
      </Radio.Group>

      <div className="payment-summary">
        <div className="summary-row">
          <span>ราคารวม</span>
          <span>{bill.amount}฿</span>
        </div>
        <div className="summary-row">
          <span>ยอดชำระ</span>
          <span>{bill.amount}฿</span>
        </div>
      </div>

      <button
        className="pay-button"
        onClick={handlePayment}
        disabled={paying}
      >
        {paying ? 'กำลังชำระ...' : 'ชำระเงิน'}
      </button>
    </div>
        </div>

  );
};

export default PaymentMethod;
