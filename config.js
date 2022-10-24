const firebase = require("firebase");

const firebaseConfig = {
  apiKey: "AIzaSyC7qKv-bAZS4Dpocw94rbCAsoFJi3LqIZY",
  authDomain: "exploding-kittens-api2.firebaseapp.com",
  projectId: "exploding-kittens-api2",
  storageBucket: "exploding-kittens-api2.appspot.com",
  messagingSenderId: "948235126096",
  appId: "1:948235126096:web:804e836c026917dffc5855"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
module.exports = db;
