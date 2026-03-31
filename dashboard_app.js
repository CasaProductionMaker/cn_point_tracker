import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDocs, addDoc, updateDoc, onSnapshot, collection, query, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { createElementHelper, createSimpleElementHelper, createEmptyButtonHelper, createInputHelper, createRadioInputHelper, createLabelHelper } from "./util.js"; 

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

// Page references
const ninjaNameDisplay = document.getElementById("ninja_name_display");
const ninjaPointsDisplay = document.getElementById("ninja_points_display");
const registerFNameInput = document.getElementById("fname");
const registerLNameInput = document.getElementById("lname");
const registerBeltInput = document.getElementById("belt");
const shopContainer = document.getElementById("shop");
const welcomeText = document.getElementById("welcome_text");

// Login info
let uid = localStorage.getItem("currentUser");
let userKey = null;
console.log("UID: " + uid);
let myProfile = {};

// Element tracking
let currentPopup = null;

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
            buyItem(parseInt(shopItem.cost));
            
        })

        shopContainer.appendChild(item);
    });
}

// Popup functionality
function showRegisterPopup() {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.id = "register_popup";

    currentPopup.appendChild(createSimpleElementHelper("h2", "First time? Register here: "));

    // First Name input
    let first_name_input_holder = document.createElement("div");
    first_name_input_holder.appendChild(createLabelHelper("First Name: ", `fname`));
    first_name_input_holder.appendChild(createInputHelper("text", `fname`));
    currentPopup.appendChild(first_name_input_holder);

    // Last Name input
    let last_name_input_holder = document.createElement("div");
    last_name_input_holder.appendChild(createLabelHelper("Last Name: ", `lname`));
    last_name_input_holder.appendChild(createInputHelper("text", `lname`));
    currentPopup.appendChild(last_name_input_holder);

    // Belt input
    let belt_input_holder = document.createElement("div");
    belt_input_holder.appendChild(createLabelHelper("Belt ID: ", `belt`));
    belt_input_holder.appendChild(createInputHelper("text", `belt`));
    currentPopup.appendChild(belt_input_holder);

    let submit_button = createEmptyButtonHelper("Register!");
    currentPopup.appendChild(submit_button);

    submit_button.addEventListener("click", (event) => {
        registerNinja();
    })
}

function removePopup() {
    document.body.removeChild(currentPopup);
    currentPopup = null;
}


async function loadPage() {
    loadShop();
    onSnapshot(doc(db, "ninjas", userKey), (snapshot) => {
        if (snapshot.exists) {
            const data = snapshot.data();
            myProfile = data;
            ninjaNameDisplay.textContent = `Name: ${data.firstname} ${data.lastname[0]}.`;
            welcomeText.textContent = `Welcome, ${data.firstname}!`;
            ninjaPointsDisplay.textContent = `Points: ${data.points}`;

            // const btn = document.createElement("button");
            // btn.addEventListener('click', function() {
            //     editPoints(5);
            // })
            // btn.textContent = "add 5!";
            // ninjaNameDisplay.appendChild(btn);
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

async function buyItem(amount) {
    await updateDoc(doc(db, "ninjas", userKey), {
        points: myProfile.points - amount
    })
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

    removePopup();
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