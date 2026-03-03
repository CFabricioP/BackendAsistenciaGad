// // services/fcm.js
// let _fetch = global.fetch;
// try { if (!_fetch) _fetch = require('node-fetch'); } catch (_) {}

// const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';
// const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

// if (!FCM_SERVER_KEY) {
//   console.warn('[FCM] Falta FCM_SERVER_KEY en .env. Envíos fallarán.');
// }

// async function sendFCMToTokens(tokens, { titulo, cuerpo, data = {} }) {
//   if (!Array.isArray(tokens)) tokens = [tokens].filter(Boolean);

//   const payload = {
//     registration_ids: tokens,
//     notification: { title: titulo, body: cuerpo },
//     data,
//     priority: "high"
//   };

//   const res = await _fetch(FCM_ENDPOINT, {
//     method: 'POST',
//     headers: {
//       Authorization: `key=${FCM_SERVER_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(payload),
//   });

//   const json = await res.json().catch(() => ({}));
//   if (!res.ok) throw new Error(json?.error || `FCM HTTP ${res.status}`);

//   return json;
// }

// module.exports = { sendFCMToTokens };
// services/fcm.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  // const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  //Tengo el json en un archivo local para evitar problemas de parseo en Heroku
  const serviceAccount = require('../serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function sendFCMToTokens(tokens, { titulo, cuerpo, data = {} }) {
  if (!Array.isArray(tokens)) tokens = [tokens].filter(Boolean);

  const message = {
    notification: { title: titulo, body: cuerpo },
    data,
    tokens: tokens
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return response;
}

module.exports = { sendFCMToTokens };