import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, increment, arrayUnion, arrayRemove, query, orderBy, getDocs, getDoc, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { createElementHelper, createEmptyButtonHelper } from "./util.js";
import { shopTags } from "./data.js";

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
const db = getFirestore(app);

// Page references
const mainContent = document.querySelector(".main_content");
const normalItemsButton = document.querySelector("#normal_items_button");
const Print3dItemsButton = document.querySelector("#print_3d_items_button");

// shop tracking
let shop = {};
let shopElements = {};

// On page load
async function loadPage() {
    const shopItems = await getDocs(collection(db, "shop"));
    shopItems.forEach(async (doc) => {
        let value = doc.data();

        let item = document.createElement("div");
        item.classList.add("shop_item");

        let image = document.createElement("img");
        image.src = value.imageBase64 || "Images/EmptyImage.jpg";
        item.appendChild(image);
        
        let ticketBar = document.createElement("div");
        ticketBar.classList.add("ticket_bar");
        if (value.itemTags) {
            value.itemTags.forEach((tag) => {
                ticketBar.appendChild(createElementHelper("h2", "", shopTags[tag]));
            });
        }
        item.appendChild(ticketBar);

        let name = createElementHelper("h1", "", `${value.name} ${value.category == null || value.category == "normal_item" ? `(${value.cost} points)` : ""}`);
        item.appendChild(name);

        item.addEventListener("click", (event) => {
            // click
        });

        // Save value for editing purposes
        shop[doc.id] = doc.data();

        shopElements[doc.id] = item;
        mainContent.appendChild(item);
    })

    // Sidebar buttons
    normalItemsButton.addEventListener("click", (event) => {
        Object.keys(shop).forEach((itemKey) => {
            const itemData = shop[itemKey];
            const itemElement = shopElements[itemKey];
            
            let isShown = false;
            if (itemData.category == null || itemData.category == "normal_item") {
                isShown = true;
            }

            itemElement.style.display = isShown ? "flex" : "none";
        });
    })
    Print3dItemsButton.addEventListener("click", (event) => {
        Object.keys(shop).forEach((itemKey) => {
            const itemData = shop[itemKey];
            const itemElement = shopElements[itemKey];
            
            let isShown = false;
            if (itemData.category != null && itemData.category == "3d_print") {
                isShown = true;
            }

            itemElement.style.display = isShown ? "flex" : "none";
        });
    });

    Object.keys(shop).forEach((itemKey) => {
        const itemData = shop[itemKey];
        const itemElement = shopElements[itemKey];
        
        let isShown = false;
        if (itemData.category == null || itemData.category == "normal_item") {
            isShown = true;
        }

        itemElement.style.display = isShown ? "flex" : "none";
    });
}


loadPage();