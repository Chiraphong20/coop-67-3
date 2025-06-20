import './CSS/App.css';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h2>เมนูหลัก</h2>
      <div className="menu">
        <Link to="/profile" className="button">ไปที่โปรไฟล์</Link>
        <Link to="/repair" className="button">แจ้งซ่อม</Link>
        <Link to="/my-bills" className="button">ค้างชำระ</Link>
        <Link to="/register" className="button">ลงทะเบียน</Link>
        <Link to="/status" className="button">ติดตามสถานะ</Link>
        <Link to="/menupage" className="button">อื่นๆ</Link>
        <Link to="/dashboard" className="button">นิติห้อง</Link>
        <Link to="/machanicstatus" className="button">ติดตามสถานะช่าง</Link>
        <Link to="/machaniccase" className="button">เคสซ่อมแซม</Link>
        <Link to="/machanic" className="button">รายละเอียดคำสั่งซ่อม</Link>
        <Link to="/meet" className="button">จองห้องประชุม</Link>
        <Link to="/finance" className="button">เบิกจ่ายค่าส่วนกลาง</Link>

        <a href="CondoPayment.html" className="button" target="_blank" rel="noopener noreferrer">
          คนค้างชำระ
        </a>
      </div>
    </div>
  );
}

export default Home;
