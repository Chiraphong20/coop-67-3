import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./CSS/MenuPage.css";

const MenuPage = () => {
  return (
    <div className="menu-layout">
      <div className="menu-sidebar">
        <Link to="/menupage/meet" className="menu-card">จองห้องประชุม</Link>
        <Link to="/menupage/finance" className="menu-card">เบิกจ่ายค่าส่วนกลาง</Link>
      </div>
      <div className="menu-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MenuPage;
