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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
console.log("UID: " + uid);
let myProfile = {};

function loadShop() {
    Object.keys(shopItems).forEach((key) => {
        const value = shopItems[key];
        let item = document.createElement("div");
        item.classList.add("shop_option", "layer_3");

        item.innerHTML = `
            <h3>${key} (${value.cost} points)</h3>
            <p>${value.description}</p>
            <button onclick="console.log('Not added yet!!')" class="full_width_button layer_4">Purchase</button>
        `;

        shopContainer.appendChild(item);
    });
}

function showRegisterPopup() {
    registerPopup.style.display = "flex";
}

async function loadPage() {
    loadShop();
    db.collection("ninjas").doc(uid).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            myProfile = data;
            ninjaNameDisplay.textContent = `Name: ${data.firstname} ${data.lastname[0]}.`;
            welcomeText.textContent = `Welcome, ${data.firstname}`;
            ninjaPointsDisplay.textContent = `Points: ${data.points}`;
        } else {
            console.log("Ninja not registered!");
        }
    }, (error) => {
        console.error("Error:", error);
    });
}

function editPoints(amount) {
    db.collection("ninjas").doc(uid).update({
        points: myProfile.points + amount
    });
}

function registerNinja() {
    const fname = registerFNameInput.value;
    const lname = registerLNameInput.value;
    const belt = registerBeltInput.value;
    db.collection("ninjas").doc(uid).set({
        firstname: fname,
        lastname: lname, 
        points: 0, 
        belt: belt
    });
    registerPopup.style.display = "none";
    loadPage();
}

// Start app
db.collection("ninjas").doc(uid).get().then((doc) => {
    if (doc.exists) {
        loadPage();
    } else {
        showRegisterPopup();
    }
});