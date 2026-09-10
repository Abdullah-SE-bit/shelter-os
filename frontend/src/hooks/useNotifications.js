import { useState, useEffect } from 'react';
import { notificationsApi } from '../api/notificationsApi';

const useNotifications = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await notificationsApi.unreadCount();
        setCount(data.data?.count || 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return { unreadCount: count, setCount };
};

export default useNotifications;
