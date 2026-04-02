import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDocs, addDoc, updateDoc, onSnapshot, collection, query, where, increment } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { createElementHelper, createSimpleElementHelper, createEmptyButtonHelper, createInputHelper, createRadioInputHelper, createLabelHelper } from "./util.js"; 

const ADMIN_PW = "admin6699" //TODO:Will be moved to an env file later?

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
const shopContainer = document.getElementById("shop");
const welcomeText = document.getElementById("welcome_text");

// Login info
let uid = localStorage.getItem("currentUser");
let userKey = null;
console.log("UID: " + uid);
let myProfile = {};

// Element tracking
let currentPopup = null;
let myInterval;

async function loadShop() {
    const gottenShop = await getDocs(collection(db, "shop"));
    gottenShop.forEach((doc) => {
        const shopItem = doc.data();
        let item = document.createElement("div");
        item.classList.add("shop_option", "layer_3");

        item.innerHTML = `
            <h3>${shopItem.name} (${shopItem.cost} points)</h3>
            <p>${shopItem.description}</p>
            <button class="purchase_button">PURCHASE</button>
        `;

        item.querySelector(".purchase_button").addEventListener("click", (event) => {
            // buy item
            if (myProfile.points >= shopItem.cost) {
                showPurchasePopup("admin_part", shopItem.cost);
            } else {
                showWarningPopup("You do not have enough money to make this purchase!");
            }
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
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "register_popup";
    actualPopup.classList.add("popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", "First time? Register here: "));

    // First Name input
    let first_name_input_holder = document.createElement("div");
    first_name_input_holder.appendChild(createLabelHelper("First Name: ", `fname`));
    first_name_input_holder.appendChild(createInputHelper("text", `fname`));
    actualPopup.appendChild(first_name_input_holder);

    // Last Name input
    let last_name_input_holder = document.createElement("div");
    last_name_input_holder.appendChild(createLabelHelper("Last Name: ", `lname`));
    last_name_input_holder.appendChild(createInputHelper("text", `lname`));
    actualPopup.appendChild(last_name_input_holder);

    // Belt input
    let belt_input_holder = document.createElement("div");
    belt_input_holder.appendChild(createLabelHelper("Belt ID: ", `belt`));
    belt_input_holder.appendChild(createInputHelper("text", `belt`));
    actualPopup.appendChild(belt_input_holder);

    let submit_button = createEmptyButtonHelper("Register!");
    actualPopup.appendChild(submit_button);

    submit_button.addEventListener("click", (event) => {
        registerNinja();
    })

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showPurchasePopup(purchasePopupState, cost) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "popup_container";
    actualPopup.classList.add("popup", "small_popup");

    if (purchasePopupState == "admin_part") {
        actualPopup.appendChild(createSimpleElementHelper("h2", "Buy shop item: "));

        // First Name input
        let admin_password = document.createElement("div");
        admin_password.appendChild(createLabelHelper("Admin password: ", `admin_password`));
        admin_password.appendChild(createInputHelper("password", `admin_password`));
        actualPopup.appendChild(admin_password);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let next_button = createEmptyButtonHelper("NEXT");
        button_bar.appendChild(next_button);

        let cancel_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(cancel_button);

        next_button.addEventListener("click", (event) => {
            // TODO :D
            if (document.querySelector("#admin_password").value == ADMIN_PW) { // HARDCODED FOR NOW

                editPoints(cost * -1); //subtracted
                alert("Purchase successful!");
                removePopup();
                //showPurchasePopup("purchase_part");


                nfcInput.value = "";
                setInterval(() => {
                    nfcInput.focus();
                }, 500);
            } else {
                removePopup();
                showWarningPopup("Incorrect Password!");
            }
        })

        cancel_button.addEventListener("click", (event) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);
    } else if (purchasePopupState == "purchase_part") {
        actualPopup.appendChild(createSimpleElementHelper("h2", "Tap your belt wristband to confirm the purchase!"));

        // NFC invisible input
        let tap_band_input = document.createElement("div");
        tap_band_input.appendChild(createInputHelper("text", `tap_band_input`));
        actualPopup.appendChild(tap_band_input);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let cancel_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(cancel_button);

        cancel_button.addEventListener("click", (event) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);
    }

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showWarningPopup(warningText) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "popup_container";
    actualPopup.classList.add("popup", "small_popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", warningText));

    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");
    let cancel_button = createEmptyButtonHelper("OK");
    button_bar.appendChild(cancel_button);

    cancel_button.addEventListener("click", (event) => {
        removePopup();
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
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

async function registerNinja() {
    const fname = document.querySelector("#fname").value;
    const lname = document.querySelector("#lname").value;
    const belt = Number(document.querySelector("#belt").value);
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