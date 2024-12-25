importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-database-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBz0z6s3y8AG92E_Nj7gBoSqhZoTwkjvaU",
  authDomain: "cloud-computing-task-4e32f.firebaseapp.com",
  databaseURL: "https://cloud-computing-task-4e32f-default-rtdb.firebaseio.com",
  projectId: "cloud-computing-task-4e32f",
  storageBucket: "cloud-computing-task-4e32f.firebaseapp.com",
  messagingSenderId: "621439371688",
  appId: "1:621439371688:web:a2685bc39ff62aa7bbb59d",
  measurementId: "G-MZ5K6TNFXS"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const messaging = firebase.messaging();
const realTimeDb = firebase.database();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "Background Message";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new message.",
    icon: payload.notification?.image
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

  handleDynamicTopicSubscription(payload.data);
  saveMessageToDatabase(payload);
  
});

function handleDynamicTopicSubscription(data) {
  if (data.subscribeToTopic) {
    const topic = data.subscribeToTopic;
    console.log(`Sending subscription request to backend for topic: ${topic}`);
    sendToBackend('/api/subscribe', self.currentFCMToken, topic);
  }

  if (data.unsubscribeToTopic) {
    const topic = data.unsubscribeToTopic;
    console.log(`Sending unsubscription request to backend for topic: ${topic}`);
    sendToBackend('/api/unsubscribe', self.currentFCMToken, topic);
  }
  console.log("Service Worker Token:", self.currentFCMToken);
}

function sendToBackend(endpoint, token, topic) {
  const backendURL = "http://localhost:3000";  

  fetch(`${backendURL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: token,
      topic: topic
    })
  })
  .then((response) => response.json())
  .then((data) => console.log("Server response:", data))
  .catch((err) => console.error("Error:", err));
}
function saveMessageToDatabase(payload) {
  const notificationsRef = realTimeDb.ref('notifications');
  const newNotificationRef = notificationsRef.push();
  const sanitizedData = {};
  for (const key in payload.data) {
    const sanitizedKey = key.replace(/[.$[\]#\/]/g, '_');
    sanitizedData[sanitizedKey] = payload.data[key];
  }
  newNotificationRef.set({
    timestamp: new Date().toISOString(),
    data: sanitizedData,
    notification: payload.notification || null
  }).then(() => {
    console.log("message is saved to db successfully!");
  }).catch((error) => {
    console.error("Error saving message to db:", error);
  });
}
