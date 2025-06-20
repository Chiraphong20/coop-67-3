import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Spin, message } from 'antd';
import './CSS/BillDetail.css';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handlePay = () => {
    navigate(`/payment-method/${id}`);
  };

  if (loading) return <Spin style={{ marginTop: '50px' }} tip="กำลังโหลด..." />;

  if (!bill) return <div>ไม่พบบิล</div>;

  const amount = parseFloat(bill.amount);
  const priceBeforeVAT = amount / 1.07;
  const vatAmount = amount - priceBeforeVAT;

  return (
    <div className="container-bill-detail">
      <h2>รายละเอียดบิลของฉัน</h2>

      <div className="bill-detail">
        <div className="row">
          <div>{bill.billingCycle}</div>
          <div className={`status ${bill.status === 'ยังไม่ชำระ' ? 'unpaid' : 'paid'}`}>
            {bill.status}
          </div>
        </div>

        <div className="row">
          <div>กำหนดชำระ:</div>
          <div>{bill.dueDate?.toDate ? bill.dueDate.toDate().toLocaleDateString() : bill.dueDate}</div>
        </div>

        <div className="row">
          <div>รวมค่าบริการก่อนภาษีมูลค่าเพิ่ม</div>
          <div>{priceBeforeVAT.toFixed(2)}฿</div>
        </div>

        <div className="row">
          <div>ภาษีมูลค่าเพิ่ม (VAT 7%)</div>
          <div>{vatAmount.toFixed(2)}฿</div>
        </div>

        <div className="row total">
          <div>รวมค่าใช้บริการรอบปัจจุบัน</div>
          <div>{amount.toFixed(2)}฿</div>
        </div>
      </div>

      {bill.status === 'ยังไม่ชำระ' && (
        <button onClick={handlePay} className="pay-button-detail">
          ชำระเงิน
        </button>
      )}
    </div>
  );
};

export default BillDetail;
