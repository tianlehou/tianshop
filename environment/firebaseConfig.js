// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// - From: tianshop1983@gmail.com
const firebaseConfig = {
  apiKey: "AIzaSyDu_DMItpXAlkOktkuz2uMuSzqGlVaHq3M",
  authDomain: "tian-shop.firebaseapp.com",
  databaseURL: "https://tian-shop-default-rtdb.firebaseio.com",
  projectId: "tian-shop",
  storageBucket: "tian-shop.firebasestorage.app",
  messagingSenderId: "857359481409",
  appId: "1:857359481409:web:6125a75be0bfc44da5a4c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
