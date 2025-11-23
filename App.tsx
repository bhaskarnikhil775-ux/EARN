import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2sVaRwL61ZKSM1dmLttbTrDXm-cQsgcI",
  authDomain: "scratch-earn-fc3ed.firebaseapp.com",
  projectId: "scratch-earn-fc3ed",
  storageBucket: "scratch-earn-fc3ed.firebasestorage.app",
  messagingSenderId: "370359166230",
  appId: "1:370359166230:web:42dbf1c0a79b4417e75c37"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
    client_id: "370359166230-4gvm3ea2p5amja0010nvc6rcn2do4eh7.apps.googleusercontent.com" 
});

window.handleGoogleLogin = async () => {
    try {
        await signInWithPopup(auth, provider);
        alert("Login Successful!");
    } catch (error) {
        console.error("Login Failed:", error);
        alert("Login failed. Check console for details.");
    }
}

document.getElementById('root').innerHTML = `
  <div style="text-align: center; padding: 50px;">
    <h1>Scratch Earn</h1>
    <p>Daily Scratch, Spin & Win Real Cash</p>
    <button onclick="handleGoogleLogin()" style="padding: 10px 20px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Continue with Google
    </button>
  </div>
`;
