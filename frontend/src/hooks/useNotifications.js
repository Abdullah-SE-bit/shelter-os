'use client';

import { useState } from 'react';
import { mockNotifications } from '@/lib/mock-data/notifications';

// Mock playground: no polling, no backend — just the unread count baked
// into the static notifications list.
const useNotifications = () => {
  const [count, setCount] = useState(() => mockNotifications.filter((n) => !n.is_read).length);
  return { unreadCount: count, setCount };
};

export default useNotifications;
