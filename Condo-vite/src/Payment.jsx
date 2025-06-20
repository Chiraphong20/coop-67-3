import React, { useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import liff from '@line/liff';
import { Link } from 'react-router-dom';
import './CSS/Payment.css';

const Payment = () => {
  const [activeTab, setActiveTab] = useState('my-bills');
  const [userId, setUserId] = useState(null);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await liff.init({ liffId: '2007355122-E0m4pBGK' });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        const uid = profile.userId;
        setUserId(uid);
        localStorage.setItem('userId', uid);

        const paymentsRef = collection(db, 'users', uid, 'payments');

        const unpaidQuery = query(paymentsRef, where('status', '==', 'ยังไม่ชำระ'));
        const paidQuery = query(paymentsRef, where('status', '==', 'ชำระแล้ว'));

        const [unpaidSnap, paidSnap] = await Promise.all([
          getDocs(unpaidQuery),
          getDocs(paidQuery),
        ]);

        const formatBillData = (docs) =>
          docs.map((doc) => {
            const data = doc.data();

            const dueDate =
              data.dueDate && typeof data.dueDate.toDate === 'function'
                ? data.dueDate.toDate().toLocaleDateString()
                : data.dueDate || '';

            const paidDate =
              data.paidDate && typeof data.paidDate.toDate === 'function'
                ? data.paidDate.toDate().toLocaleDateString()
                : data.paidDate || '';

            return {
              id: doc.id,
              ...data,
              dueDate,
              paidDate,
            };
          });

        setUnpaidBills(formatBillData(unpaidSnap.docs));
        setPaidBills(formatBillData(paidSnap.docs));

        setLoading(false);
      } catch (error) {
        message.error('เกิดข้อผิดพลาด: ' + error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Spin style={{ marginTop: '50px' }} tip="กำลังโหลดบิลของคุณ..." />;

  return (
  <div className="payment-wrapper">
    <h2>ค้างชำระ</h2>
    <div className='content-payment-m'>
      <div className="tab-bar" style={{width:'100%'}}>
        <div
          className={`tab ${activeTab === 'my-bills' ? 'active' : ''}`}
          onClick={() => switchTab('my-bills')}
        >
          บิลของฉัน
        </div>
        <div
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => switchTab('history')}
        >
          ประวัติ
        </div>
      </div>

      <div className="container-payment">
{activeTab === 'my-bills' && unpaidBills.length === 0 && (
  <div className='Reload'>
  <p>ไม่มีบิลที่ยังไม่ชำระ</p>
  </div>
)}        {activeTab === 'my-bills' &&
          unpaidBills.map((bill) => (
            <div key={bill.id} className="bill-card">
              <div className="bill-header">
                <div>{bill.type}</div>
                <div className="status-red">{bill.status}</div>
              </div>
              <div className="row">
                <div>ยอดที่ต้องชำระ</div>
                <div>{bill.amount}฿</div>
              </div>
              <div className="row">
                <div>รอบบิล</div>
                <div>{bill.billingCycle}</div>
              </div>
              <div className="row">
                <div>กำหนดชำระ</div>
                <div>{bill.dueDate}</div>
              </div>
              <Link to={`/bill-detail/${bill.id}`} className="detail-link">รายละเอียดบิล</Link>
            </div>
          ))}

        {activeTab === 'history' && paidBills.length === 0 && <p>ไม่มีประวัติการชำระเงิน</p>}
        {activeTab === 'history' &&
          paidBills.map((bill) => (
            <div key={bill.id} className="bill-card">
              <div className="bill-header">
                <div>{bill.type}</div>
                <div className="status-green">{bill.status}</div>
              </div>
              <div className="row">
                <div>ยอดที่ชำระ</div>
                <div>{bill.amount}฿</div>
              </div>
              <div className="row">
                <div>รอบบิล</div>
                <div>{bill.billingCycle}</div>
              </div>
              <div className="row">
                <div>วันชำระ</div>
                <div>{bill.paidDate || '-'}</div>
              </div>
              <Link to={`/bill-detail/${bill.id}`} className="detail-link">
                รายละเอียดบิล
              </Link>
            </div>
          ))}
      </div>
    </div>
        </div>

  );
};

export default Payment;
