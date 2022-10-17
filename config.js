const firebase = require("firebase");

const firebaseConfig = {
  apiKey: "AIzaSyDQJNk4KB8eNEzSq5TFpqo_V3Wf9cSHg10",
  authDomain: "exploding-kittens-api.firebaseapp.com",
  projectId: "exploding-kittens-api",
  storageBucket: "exploding-kittens-api.appspot.com",
  messagingSenderId: "59881806540",
  appId: "1:59881806540:web:8ebc6aeda59a1821fe8069",
  measurementId: "G-TL7MK2Q5JG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
module.exports = db;

//const User = db.collection('Users');
//const FriendInvite = db.collection('Friend Invites');
//const MatchInvites = db.collection("Match Invites");


//module.exports = FriendInvite;
//module.exports = MatchInvites;