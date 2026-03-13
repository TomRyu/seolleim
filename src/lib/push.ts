import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@middle-age-land.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (err: any) {
    // 구독 만료 시 무시
    if (err.statusCode !== 404 && err.statusCode !== 410) throw err;
  }
}

export { webpush };
