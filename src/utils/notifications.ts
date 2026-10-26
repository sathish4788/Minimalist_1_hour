export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationStatus;
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.warn('requestPermission error:', err);
    return false;
  }
}

/**
 * Triggers a native system notification.
 * On mobile Android Chrome / PWAs, new Notification() throws an Illegal Constructor error;
 * ServiceWorkerRegistration.showNotification() is strictly required.
 */
export async function triggerBrowserNotification(
  title: string,
  body: string,
  tag?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // If permission is not yet granted, try requesting it
  if (Notification.permission !== 'granted') {
    if (Notification.permission === 'default') {
      const granted = await requestBrowserNotificationPermission();
      if (!granted) return false;
    } else {
      return false;
    }
  }

  const notificationOptions: NotificationOptions & Record<string, unknown> = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    tag: tag || `todo-reminder-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    // Vibration pattern for mobile devices (vibrate 250ms, pause 100ms, vibrate 250ms)
    vibrate: [250, 100, 250],
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  };

  // 1. Preferred modern path: ServiceWorkerRegistration.showNotification()
  // This is mandatory on Android Chrome and installed PWAs
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notificationOptions);
        // Also trigger device vibration directly in page context if supported
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate([250, 100, 250]);
        }
        return true;
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification failed, attempting fallback:', swErr);
    }
  }

  // 2. Desktop browser fallback: standard Notification constructor
  try {
    const n = new Notification(title, notificationOptions);
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (notifErr) {
    console.warn('new Notification constructor failed:', notifErr);
    return false;
  }
}
