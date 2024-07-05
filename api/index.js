const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'greeenprem';
const MONGO_URI = 'mongodb://localhost:27017/'; // Replace with your MongoDB URI
const DB_NAME = 'coinflip';
const COLLECTION_NAME = 'games';

app.use(bodyParser.json());

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch(error => console.error('Error connecting to MongoDB:', error));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT
const verifyJWT = (req, res, next) => {
  const token = req.headers['authorization'];
  console.log(token)

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  try {
    console.log(token)
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
  } catch (err) {
    console.error('Invalid token:', err);
    return res.status(401).send('Invalid Token');
  }
  return next();
};

// Verify endpoint
// Verify endpoint
app.post('/verify', verifyJWT, async (req, res) => {
  const username = req.query.username
  const token = req.headers['authorization'];

  console.log('Verify endpoint hit. User:', req.user, 'Request body:', req.body);

  if (req.user.username === username) {
    const usersCollection = db.collection('users');
    user = await usersCollection.findOne({ username: req.user.username });
    return res.json({ success: true, username: user.username, balance:user.balance, token: token });
  } else {
    return res.status(403).json({ success: false, message: 'Username does not match the token' });
  }
});

app.post('/games', verifyJWT, async (req, res) => {
  const { created_by, value, time } = req.body;
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).send('Authorization token is missing');
  }

  try {
    // Decrypt the token to get the user data
    const decoded = jwt.verify(token, SECRET_KEY); // Replace 'your-secret-key' with your actual secret key
    const username = decoded.username;

    // Check if the created_by matches the username from the token
    if (username !== created_by) {
      return res.status(403).send('User not authorized to create this game');
    }

    // Find the user in the MongoDB collection
    const user = await db.collection('users').findOne({ username: username });
    
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user has enough balance
    if (user.balance < value) {
      return res.status(400).send('Insufficient balance');
    }

    // Subtract the game value from the user's balance
    const newBalance = user.balance - value;
    await db.collection('users').updateOne({ username: username }, { $set: { balance: newBalance } });

    // Create the game
    const game = { 'createdby': created_by, 'value': value, 'time': new Date().getTime() };
    const result = await db.collection(COLLECTION_NAME).insertOne(game);

    res.status(201).send({
      message: 'Game created successfully',
    });
  } catch (error) {
    console.error('Error processing the request:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/games', verifyJWT, (req, res) => {
  db.collection(COLLECTION_NAME).find().toArray()
    .then(games => res.status(200).json(games))
    .catch(error => {
      console.error('Error fetching games from the database:', error);
      res.status(500).send('Error fetching games from the database');
    });
});

const CLIENT_ID = '1050273183264596456';
const CLIENT_SECRET = 'RBX-lPnNr8aLJkuZuVuxquZLa3hBipRfYTShdPX8GvrmtbstXy89644vhlC3_5XyTvXW';
const REDIRECT_URI = 'https://coinflip-mu-vert.vercel.app/auth/roblox/callback';

var inputName;
// Endpoint to redirect user for Roblox OAuth
app.get('/auth/roblox', (req, res) => {
  inputName = req.query.username;
  const authorizationUrl = `https://apis.roblox.com/oauth/v1/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=openid`;
  res.redirect(authorizationUrl);
});

// Callback endpoint to handle Roblox OAuth redirect
app.get('/auth/roblox/callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

    const accessToken = tokenResponse.data.access_token;

    // Use the access token to fetch user info
    const userInfoResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = userInfoResponse.data.sub;
    
    const usernameRes = await axios.get('https://users.roblox.com/v1/users/'+userInfo);
    const userinfo = usernameRes.data;
    const Name = userinfo.name;

    if (userinfo.name === inputName) {
      const token = jwt.sign({ user: userInfo, username: userinfo.name }, SECRET_KEY, { expiresIn: '1h' });
      const usersCollection = db.collection('users');
      let user = await usersCollection.findOne({ username: Name });
      if (!user) {
        // If user doesn't exist, create a new user with balance 0
        const newUser = {
          'username': Name,
          balance: 0.0
        };
        await usersCollection.insertOne(newUser); 
        user = await usersCollection.findOne({ username: Name });
      }
      console.log(user);

      const responseData = {
        success: true,
        token: token,
        userInfo: userinfo,
        username: userinfo.name,
        balance: user.balance
      };
      res.send(`
        <script>
          window.opener.postMessage(${JSON.stringify(responseData)}, '*');
          window.close();
        </script>
      `);
    } else {
      res.status(401).send('Username verification failed.');
    }
  } catch (error) {
    console.error('Error during OAuth process:', error);
    res.status(500).send('An error occurred during the OAuth process.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
