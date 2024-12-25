import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getMessaging, onMessage, getToken } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js";
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const dbfirebaseConfig = {
  apiKey: "AIzaSyBz0z6s3y8AG92E_Nj7gBoSqhZoTwkjvaU",
  authDomain: "cloud-computing-task-4e32f.firebaseapp.com",
  databaseURL: "https://cloud-computing-task-4e32f-default-rtdb.firebaseio.com",
  projectId: "cloud-computing-task-4e32f",
  storageBucket: "cloud-computing-task-4e32f.firebaseapp.com",
  messagingSenderId: "621439371688",
  appId: "1:621439371688:web:a2685bc39ff62aa7bbb59d",
  measurementId: "G-MZ5K6TNFXS"
};

const app = initializeApp(dbfirebaseConfig);
const realTimeDb = getDatabase(app);
const messaging = getMessaging(app);

async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging);
      console.log("firebase token:", token);
      window.currentFCMToken = token;
      //sending token to the service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "FCM_TOKEN", token: token });
      }
    }
  } catch (err) {
    console.error("permission denied", err);
  }
}

requestPermission();

onMessage(messaging, (payload) => {
  console.log("FG message received:", payload);
  handleDynamicTopicSubscription(payload.data);
  saveMessageToDatabase(payload);
  updateNotifications(payload);
});

async function updateNotifications(payload) {
  try {
    const tableBody = document.querySelector('#notificationsTable tbody');
    const row = document.createElement('tr');
    const timestampCell = document.createElement('td');
    timestampCell.textContent = new Date().toISOString();
    row.appendChild(timestampCell);

    const notificationCell = document.createElement('td');
    notificationCell.textContent = payload.notification ? payload.notification.title : 'No Notification';
    row.appendChild(notificationCell);
    const dataCell = document.createElement('td');
    dataCell.textContent = payload.data ? JSON.stringify(payload.data) : 'No Data';
    row.appendChild(dataCell);
    tableBody.appendChild(row);
  }
  catch (error){
    console.error("error updating notification list:", error);
  }
}
async function saveMessageToDatabase(payload) {
  try {
    const notificationsRef = ref(realTimeDb, 'notifications');
    const newNotificationRef = push(notificationsRef);
    await set(newNotificationRef, {
      timestamp: new Date().toISOString(),
      data: sanitizeKeys(payload.data),
      notification: payload.notification || null,
    });
    console.log("Message saved to db");
  }
  catch (error){
    console.error("error when saving message to the db:", error);
  }
}

function sanitizeKeys(obj) {
  const sanitizedObj = {};
  for (const key in obj) {
    const sanitizedKey = key.replace(/[.$[\]#\/]/g, '_');
    sanitizedObj[sanitizedKey] = obj[key];
  }
  return sanitizedObj;
}

function handleDynamicTopicSubscription(data) {
  if (data.subscribeToTopic) {
    const topic = data.subscribeToTopic;
    console.log(`Sending subscription request to backend for topic: ${topic}`);
    sendToBackend('/api/subscribe', window.currentFCMToken, topic);
  }

  if (data.unsubscribeToTopic) {
    const topic = data.unsubscribeToTopic;
    console.log(`Sending unsubscription request to backend for topic: ${topic}`);
    sendToBackend('/api/unsubscribe', window.currentFCMToken, topic);
  }
  console.log("Current FCM Token:", window.currentFCMToken);
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


async function fetchNotifications() {
  try {
    const notificationsRef = ref(realTimeDb, 'notifications');
    const snapshot = await get(notificationsRef);
    if (snapshot.exists()) {
      const notificationsList = Object.values(snapshot.val());

      const tableBody = document.querySelector('#notificationsTable tbody');
      if (!tableBody) {
        console.error("Table body element not found.");
        return;
      }
      tableBody.innerHTML = '';

      notificationsList.forEach(notification => {
        const row = document.createElement('tr');

        const timestampCell = document.createElement('td');
        timestampCell.textContent = notification.timestamp || 'No Timestamp';
        row.appendChild(timestampCell);

        const notificationCell = document.createElement('td');
        notificationCell.textContent = notification.notification ? notification.notification.title : 'No Notification';
        row.appendChild(notificationCell);

        const dataCell = document.createElement('td');
        dataCell.textContent = notification.data ? JSON.stringify(notification.data) : 'No Data';
        row.appendChild(dataCell);

        tableBody.appendChild(row);
      });
    }
    else {
      console.log("there are no notifications");
    }
  }
  catch (error){
    console.error("Error fetching notifications:", error);
  }
}

window.onload = fetchNotifications;
