import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDocs, addDoc, updateDoc, onSnapshot, collection, query, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD4Ji7FYEOi0IseOh4b8FCGtj5gw1UQu34",
    authDomain: "codeninjaspointtracker.firebaseapp.com",
    projectId: "codeninjaspointtracker",
    storageBucket: "codeninjaspointtracker.firebasestorage.app",
    messagingSenderId: "147397952733",
    appId: "1:147397952733:web:1a25cd7aaf1822c1c0c734"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Consts
const shopItems = {
    "Candy": {
        cost: 20, 
        description: "Choose a small candy out of a few options."
    }, 
    "Sticker": {
        cost: 10,
        description: "Choose a sticker from the front desk."
    },
    "3D printing project": {
        cost: 200,
        description: "Do a 3D printing project in a class."
    }
};

// Page references
const ninjaNameDisplay = document.getElementById("ninja_name_display");
const ninjaPointsDisplay = document.getElementById("ninja_points_display");
const registerFNameInput = document.getElementById("fname");
const registerLNameInput = document.getElementById("lname");
const registerBeltInput = document.getElementById("belt");
const shopContainer = document.getElementById("shop");
const registerPopup = document.getElementById("register_popup");
const welcomeText = document.getElementById("welcome_text");

// Login info
let uid = localStorage.getItem("currentUser");
let userKey = null;
console.log("UID: " + uid);
let myProfile = {};

async function loadShop() {
    const gottenShop = await getDocs(collection(db, "shop"));
    gottenShop.forEach((doc) => {
        const shopItem = doc.data();
        let item = document.createElement("div");
        item.classList.add("shop_option", "layer_3");

        item.innerHTML = `
            <h3>${shopItem.name} (${shopItem.cost} points)</h3>
            <p>${shopItem.description}</p>
            <button class="full_width_button layer_4 purchase_button">Purchase</button>
        `;

        item.querySelector(".purchase_button").addEventListener("click", (event) => {
            // buy item
            console.log("Not added but soon...")
        })

        shopContainer.appendChild(item);
    });
}

function showRegisterPopup() {
    registerPopup.style.display = "flex";
    document.getElementById("register_button").addEventListener("click", (event) => {
        registerNinja();
    })
}

async function loadPage() {
    loadShop();
    onSnapshot(doc(db, "ninjas", userKey), (snapshot) => {
        if (snapshot.exists) {
            const data = snapshot.data();
            myProfile = data;
            ninjaNameDisplay.textContent = `Name: ${data.firstname} ${data.lastname[0]}.`;
            welcomeText.textContent = `Welcome, ${data.firstname}`;
            ninjaPointsDisplay.textContent = `Points: ${data.points}`;
        } else {
            console.log("Ninja not registered!");
        }
    });
}

async function editPoints(amount) {
    await updateDoc(doc(db, "ninjas", userKey), {
        points: myProfile.points + amount
    });
}

async function registerNinja() {
    const fname = registerFNameInput.value;
    const lname = registerLNameInput.value;
    const belt = Number(registerBeltInput.value);
    const docRef = await addDoc(collection(db, "ninjas"), {
        firstname: fname,
        lastname: lname, 
        points: 0, 
        belt: belt, 
        nfc_id: uid, 
        points_in_history: 0
    });
    userKey = docRef.id;
    registerPopup.style.display = "none";
    loadPage();
}

// Start app

const snapshot = await getDocs(query(collection(db, "ninjas"), where("nfc_id", "==", uid)));
if (snapshot.empty) {
    showRegisterPopup();
} else {
    console.log(snapshot)
    userKey = snapshot.docs[0].id;
    loadPage();
}