import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import liff from '@line/liff';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './CSS/Profile.css';
function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linePictureUrl, setLinePictureUrl] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await liff.init({ liffId: '2007355122-aEAg2xnq' });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const userProfile = await liff.getProfile();
        const userId = userProfile.userId;

        setLinePictureUrl(userProfile.pictureUrl);

        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile({ ...docSnap.data(), uid: userId });
        } else {
          navigate('/register');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ เกิดข้อผิดพลาด:", err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="container">กำลังโหลดข้อมูล...</div>;

  const accessToken = liff.getAccessToken();
  if (!accessToken) {
    alert('⚠️ กรุณาเปิดผ่านแอป LINE เท่านั้น');
    return null;
  }

  return (
  <div className='wrapper-profile'>
    <div className="container-profile">
      <h2 style={{ color: 'white' }}>ข้อมูลส่วนตัว</h2>
      {linePictureUrl && (
        <img
          src={linePictureUrl}
          alt="รูปโปรไฟล์"
          style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 20 }}
        />
      )}
      <div className="Personal">
        <p style={{ textAlign: 'center' }}>{profile.name}</p>

        <div className="profile-page">
          {profile.role !== 'technician' && (
            <>
              <p>ห้อง <br />{profile.room}</p>
              <p>อาคาร<br /> {profile.building}</p>
            </>
          )}
          <p>เบอร์โทร<br /> {profile.phone}</p>
          <p>อีเมลล์<br /> {profile.email}</p>
        </div>
      </div>
    </div>
  </div>
);

}

export default Profile;
