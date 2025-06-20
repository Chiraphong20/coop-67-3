import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import "./CSS/FinancePage.css";

const FinancePage = () => {
  const [reports, setReports] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
 useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: '2007355122-mwPwRoAv' }); 

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
          setMessage("⚠️ ไม่พบข้อมูลผู้ใช้งาน กรุณาลงทะเบียนก่อน");
        }
      } catch (err) {
        setMessage("เกิดข้อผิดพลาดในการโหลด LIFF: " + err.message);
      }
    };

    initLiff();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const ref = collection(db, "incomes");
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        index,
      }));
      setReports(data);
    };

    fetchData();
  }, []);

  const handlePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  return (
    <div className="finance-report-list">
  
<h2 className="title">รายงานรายรับ-รายจ่าย</h2>

      {reports.map((report, index) => (
        <div key={report.id} className="report-card">
          <p className="report-label">ข้อมูลแจ้งยอดรายรับ-รายจ่าย</p>
          <p className="report-date">{report.date}</p>

          {report.image && report.image.length > 0 ? (
            <div className="report-image-wrapper">
              <img
                src={report.image[0]}
               alt={'report-${index}'}
                className="report-image"
                onClick={() => handlePreview(report.image[0])}
                style={{ cursor: "pointer" }}
              />
            </div>
          ) : (
            <div className="no-image">ไม่มีรูปภาพแนบ</div>
          )}
        </div>
      ))}

      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img
          alt="preview"
          style={{ width: "100%" }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default FinancePage;