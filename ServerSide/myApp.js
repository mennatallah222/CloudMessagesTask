const express = require('express');
const admin = require("firebase-admin");
const cors = require('cors'); 
const app = express();

app.use(cors());  

app.use(express.json());
admin.initializeApp({
  credential: admin.credential.cert("serviceAccountKey.json"),
});

app.post('/api/subscribe', (req, res) => {
  const { token, topic } = req.body;
  admin.messaging().subscribeToTopic(token, topic)
    .then(response => {
      res.json({ success: true, response });
    })
    .catch(error => {
      res.status(500).json({ success: false, error });
    });
});

app.post('/api/unsubscribe', (req, res) => {
  const { token, topic } = req.body;
  admin.messaging().unsubscribeFromTopic(token, topic)
    .then(response => {
      res.json({ success: true, response });
    })
    .catch(error => {
      res.status(500).json({ success: false, error });
    });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
