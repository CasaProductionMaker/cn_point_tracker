import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, increment, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { createElementHelper, createSimpleElementHelper, createEmptyButtonHelper, createInputHelper, createRadioInputHelper, createLabelHelper } from "./util.js"; 
import { lang } from "./data.js";

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
const ninjaContainer = document.querySelector("#ninja_container");
const shopEditorContainer = document.querySelector("#shop_editor_container");
const leaderboardEditorContainer = document.querySelector("#leaderboards_editor_container");
const addShopItemButton = document.querySelector("#add_shop_item_button");
const addLeaderboardButton = document.querySelector("#add_leaderboard_button");

// Element tracking
let ninjaElements = {};
let shopElements = {};
let leaderboardElements = {};
let currentPopup = null;

// temp reasons to add
const pointReasons = {
    "good_behaviour": 10, 
    "completed_goal": 10, 
    "belt_up": 10, 
    "level_up": 10, 
    "history": 0
};

const belts = ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Red", "Black"];

const UIPositions = ["top_left", "bottom_left", "main", "top_right", "bottom_right"];

// Database cache
let ninjas = {};
let shop = {};
let leaderboards = {};
let takenUIPositions = [];

// UI Functions
function showShopPopup(type, editID = null) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load editInfo from cache
    const editInfo = shop[editID];

    if (type == "add") {
        currentPopup = document.createElement("div");
        currentPopup.id = "shop_item_popup";
        
        currentPopup.innerHTML = `
            <h2>New Shop Item:</h2>
            <div>
                <label for="shop_item_name_input">Name: </label>
                <input type="text" name="shop_item_name_input" id="shop_item_name_input">
            </div>
            <div>
                <label for="shop_item_cost_input">Cost: </label>
                <input type="number" name="shop_item_cost_input" id="shop_item_cost_input">
            </div>
            <div>
                <label for="shop_item_description_input">Description: </label>
                <input type="text" name="shop_item_description_input" id="shop_item_description_input">
            </div>
            <button class="submit_popup_button">Add</button>
            <button class="cancel_popup_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            await addShopItem();
        })
        currentPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else if (type == "edit") {
        currentPopup = document.createElement("div");
        currentPopup.id = "shop_item_popup";
        
        currentPopup.innerHTML = `
            <h2>Edit Shop Item:</h2>
            <div>
                <label for="shop_item_name_input">Name: </label>
                <input type="text" name="shop_item_name_input" id="shop_item_name_input" value="${editInfo.name}">
            </div>
            <div>
                <label for="shop_item_cost_input">Cost: </label>
                <input type="number" name="shop_item_cost_input" id="shop_item_cost_input" value="${editInfo.cost}">
            </div>
            <div>
                <label for="shop_item_description_input">Description: </label>
                <input type="text" name="shop_item_description_input" id="shop_item_description_input" value="${editInfo.description}">
            </div>
            <button class="submit_popup_button">Apply Changes</button>
            <button class="cancel_popup_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            await editShopItem(editID);
        })
        currentPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!")
    }
}

// Popups
function showLeaderboardPopup(type, editID = null) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load editInfo from cache
    const editInfo = leaderboards[editID];

    if (type == "add") {
        currentPopup = document.createElement("div");
        currentPopup.id = "leaderboard_popup";
        
        currentPopup.appendChild(createSimpleElementHelper("h2", "Add New Leaderboard: "));

        // Name input
        let name_input_holder = document.createElement("div");
        name_input_holder.appendChild(createLabelHelper("Name: ", `leaderboard_popup_name_input`));
        name_input_holder.appendChild(createInputHelper("text", `leaderboard_popup_name_input`));
        currentPopup.appendChild(name_input_holder);
        
        // Slots Input Holder
        let slots_input_holder = document.createElement("div");
        slots_input_holder.appendChild(createLabelHelper("Slots: ", `leaderboard_popup_slots_input`));
        slots_input_holder.appendChild(createInputHelper("number", `leaderboard_popup_slots_input`));
        currentPopup.appendChild(slots_input_holder);

        // Belt filters editor
        currentPopup.appendChild(createSimpleElementHelper("h3", "Belt Filters: "));
        belts.forEach(belt => {
            let belt_input_holder = document.createElement("div");
            belt_input_holder.appendChild(createInputHelper("checkbox", `leaderboard_popup_${belt}_belt_input`));
            belt_input_holder.appendChild(createLabelHelper(belt, `leaderboard_popup_${belt}_belt_input`));
            currentPopup.appendChild(belt_input_holder);
        });
        
        // Reason filters editor
        currentPopup.appendChild(createSimpleElementHelper("h3", "Reason Filter: "));
        Object.keys(pointReasons).forEach(reason => {
            let reason_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_reason_filter_input", `leaderboard_popup_${reason}_reason_filter_input`, reason == "history", reason);
            reason_input_holder.appendChild(radioInput);
            reason_input_holder.appendChild(createLabelHelper(lang[reason], `leaderboard_popup_${reason}_reason_filter_input`));
            currentPopup.appendChild(reason_input_holder);
        });

        // Select UI position
        currentPopup.appendChild(createSimpleElementHelper("h3", "UI Position: "));
        let onTaken = false;
        UIPositions.forEach(place => {
            let place_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_place_input", `leaderboard_popup_${place}_place_input`, !takenUIPositions.includes(place) && !onTaken, place);
            if (takenUIPositions.includes(place)) {
                radioInput.disabled = true;
            } else {
                onTaken = true;
            }
            place_input_holder.appendChild(radioInput);
            place_input_holder.appendChild(createLabelHelper(lang[place], `leaderboard_popup_${place}_place_input`));
            currentPopup.appendChild(place_input_holder);
        });

        // Buttons
        let submit_button = createEmptyButtonHelper("Add");
        currentPopup.appendChild(submit_button);
        let cancel_popup_button = createEmptyButtonHelper("Cancel");
        currentPopup.appendChild(cancel_popup_button);

        submit_button.addEventListener("click", async (e) => {
            await addLeaderboard();
        })
        cancel_popup_button.addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else if (type == "edit") {

        currentPopup = document.createElement("div");
        currentPopup.id = "leaderboard_popup";
        
        currentPopup.appendChild(createSimpleElementHelper("h2", "Edit Leaderboard: "));

        // Name input
        let name_input_holder = document.createElement("div");
        name_input_holder.appendChild(createLabelHelper("Name: ", `leaderboard_popup_name_input`));
        name_input_holder.appendChild(createInputHelper("text", `leaderboard_popup_name_input`, editInfo.name));
        currentPopup.appendChild(name_input_holder);
        
        // Slots Input Holder
        let slots_input_holder = document.createElement("div");
        slots_input_holder.appendChild(createLabelHelper("Slots: ", `leaderboard_popup_slots_input`));
        slots_input_holder.appendChild(createInputHelper("number", `leaderboard_popup_slots_input`, editInfo.slots));
        currentPopup.appendChild(slots_input_holder);

        // Belt filters editor
        currentPopup.appendChild(createSimpleElementHelper("h3", "Belt Filters: "));
        belts.forEach(belt => {
            let belt_input_holder = document.createElement("div");
            let box = createInputHelper("checkbox", `leaderboard_popup_${belt}_belt_input`);
            box.checked = editInfo.belt_filters.includes(belts.indexOf(belt));
            belt_input_holder.appendChild(box);
            belt_input_holder.appendChild(createLabelHelper(belt, `leaderboard_popup_${belt}_belt_input`));
            currentPopup.appendChild(belt_input_holder);
        });
        
        // Reason filters editor
        currentPopup.appendChild(createSimpleElementHelper("h3", "Reason Filter: "));
        Object.keys(pointReasons).forEach(reason => {
            let reason_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_reason_filter_input", `leaderboard_popup_${reason}_reason_filter_input`, editInfo.reason_filter == reason, reason);
            reason_input_holder.appendChild(radioInput);
            reason_input_holder.appendChild(createLabelHelper(lang[reason], `leaderboard_popup_${reason}_reason_filter_input`));
            currentPopup.appendChild(reason_input_holder);
        });

        // Select UI position
        currentPopup.appendChild(createSimpleElementHelper("h3", "UI Position: "));
        UIPositions.forEach(place => {
            let place_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_place_input", `leaderboard_popup_${place}_place_input`, place == editInfo.ui_position, place);
            if (takenUIPositions.includes(place) && place != editInfo.ui_position) {
                radioInput.disabled = true;
            }
            place_input_holder.appendChild(radioInput);
            place_input_holder.appendChild(createLabelHelper(lang[place], `leaderboard_popup_${place}_place_input`));
            currentPopup.appendChild(place_input_holder);
        });

        // Buttons
        let submit_button = createEmptyButtonHelper("Apply Changes");
        currentPopup.appendChild(submit_button);
        let cancel_popup_button = createEmptyButtonHelper("Cancel");
        currentPopup.appendChild(cancel_popup_button);

        submit_button.addEventListener("click", async (e) => {
            await editLeaderboard(editID, editInfo.ui_position);
        })
        cancel_popup_button.addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!");
    }
}

function showSessionPopup(ninjaID) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load data from cache
    const ninjaData = ninjas[ninjaID];

    currentPopup = document.createElement("div");
    currentPopup.id = "add_session_popup";

    let title = createElementHelper("h2", null, `Add Session to ${ninjaData.firstname}:`);
    currentPopup.appendChild(title);

    // Go through all the possible reasons to get points and add a checkbox to select
    Object.keys(pointReasons).forEach(key => {
        let pointReward = pointReasons[key];

        if (pointReward <= 0) return;

        let inputHolder = document.createElement("div");

        // Create both the checkbox and label and put into div so flex doesn't change its layout
        let checkboxInput = createInputHelper("checkbox", `${key}_checkbox`);
        let labelElement = createLabelHelper(`${lang[key]} (${pointReward} points)`, `${key}_checkbox`);
        inputHolder.appendChild(checkboxInput);
        inputHolder.appendChild(labelElement);

        currentPopup.appendChild(inputHolder);
    });

    // Custom points UI
    let customInputHolder = document.createElement("div");

    let checkboxInput = createInputHelper("checkbox", "custom_points_checkbox");
    let labelElement = createLabelHelper(`Custom: `, "custom_points_checkbox");
    let custom_pts = createInputHelper("number", `custom_points_input`);
    custom_pts.setAttribute("placeholder", "Custom Amount...");
    customInputHolder.appendChild(checkboxInput);
    customInputHolder.appendChild(labelElement);
    customInputHolder.appendChild(custom_pts);

    currentPopup.appendChild(customInputHolder);

    // Bottom buttons to submit or cancel
    let submit_button = createEmptyButtonHelper("Add Session");
    currentPopup.appendChild(submit_button);

    let cancel_button = createEmptyButtonHelper("Cancel");
    currentPopup.appendChild(cancel_button);
    
    // Add event listeners
    submit_button.addEventListener("click", async (e) => {
        // Add session to ninja as subcollection
        let sessionData = {};
        let ninjaUpdates = {}; // Storing a dictionary that will only hold CHANGES for the ninja
        let pointsGotten = 0;
        Object.keys(pointReasons).forEach(async key => {
            let pointReward = pointReasons[key];

            if (pointReward <= 0) return;

            if (document.querySelector(`#${key}_checkbox`).checked) {
                pointsGotten += pointReward;
                sessionData[`${key}_points`] = pointReward;
                ninjaUpdates[`total_${key}_points`] = increment(pointReward);

                // Add info to leaderboard_entries
                await setDoc(doc(db, "leaderboard_entries", `${ninjaID}_${key}`), {
                    ninja_id: ninjaID, 
                    reason: key, 
                    points: increment(pointReward), 
                    ninja_belt_level: ninjaData.belt
                }, { merge: true })
            }
        });
        if (document.querySelector(`#custom_points_checkbox`).checked) {
            const inputVal = Number(document.querySelector(`#custom_points_input`).value);
            pointsGotten += inputVal;
            sessionData[`custom_points`] = inputVal;
            ninjaUpdates[`total_custom_points`] = increment(inputVal);
        }
        sessionData.total_points_gotten = pointsGotten;

        await addDoc(collection(db, "ninjas", ninjaID, "sessions"), sessionData);

        // Update the ninja's stats in their regular account for easy access
        ninjaUpdates.points = increment(pointsGotten);
        ninjaUpdates.points_in_history = increment(pointsGotten);
        
        await updateDoc(doc(db, "ninjas", ninjaID), ninjaUpdates);

        // Add info to leaderboard_entries
        await setDoc(doc(db, "leaderboard_entries", `${ninjaID}_history`), {
            ninja_id: ninjaID, 
            reason: "history", 
            points: increment(pointsGotten), 
            ninja_belt_level: ninjaData.belt
        }, { merge: true })

        // Close popup after done
        removePopup();
    })
    cancel_button.addEventListener("click", async (e) => {
        removePopup();
    })

    document.body.appendChild(currentPopup);
}

function showConfirmDeletePopup(callback, titleText) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    currentPopup = document.createElement("div");
    currentPopup.id = "confirm_delete_popup";

    let title = createElementHelper("h2", null, titleText);
    currentPopup.appendChild(title);

    let info = createElementHelper("p", null, "This action is irriversible.");
    currentPopup.appendChild(info);

    // Bottom buttons to submit or cancel
    let submit_button = createEmptyButtonHelper("Delete");
    currentPopup.appendChild(submit_button);

    let cancel_button = createEmptyButtonHelper("Cancel");
    currentPopup.appendChild(cancel_button);

    // Event listeners
    submit_button.addEventListener("click", async (e) => {
        callback();
    })

    cancel_button.addEventListener("click", async (e) => {
        removePopup();
    })

    document.body.appendChild(currentPopup);
}

function removePopup() {
    document.body.removeChild(currentPopup);
    currentPopup = null;
}

// Functions to add stuff based on UI input
async function addShopItem() {
    const itemName = document.querySelector("#shop_item_name_input").value;
    const itemCost = Number(document.querySelector("#shop_item_cost_input").value);
    const itemDescription = document.querySelector("#shop_item_description_input").value;
    let nameID = itemName.replaceAll(" ", "_").toLowerCase();

    await setDoc(doc(db, "shop", nameID), {
        name: itemName, 
        cost: itemCost, 
        description: itemDescription
    });

    removePopup();
}

async function addLeaderboard() {
    const leaderboardName = document.querySelector("#leaderboard_popup_name_input").value;
    const leaderboardSlots = Number(document.querySelector("#leaderboard_popup_slots_input").value);
    const UIPosition = document.querySelector("input[name='leaderboard_popup_place_input']:checked").value;
    const reasonFilter = document.querySelector("input[name='leaderboard_popup_reason_filter_input']:checked").value;

    let beltFilters = [];

    // Belt filters editor
    belts.forEach(belt => {
        if (document.querySelector(`#leaderboard_popup_${belt}_belt_input`).checked) {
            beltFilters.push(belts.indexOf(belt));
        }
    });

    await addDoc(collection(db, "leaderboards"), {
        name: leaderboardName, 
        slots: leaderboardSlots, 
        belt_filters: beltFilters, 
        reason_filter: reasonFilter, 
        ui_position: UIPosition
    });

    await updateDoc(doc(db, "settings", "leaderboard"), {
        taken_ui_positions: arrayUnion(UIPosition)
    });

    removePopup();
}

async function editShopItem(shopItemID) {
    const itemName = document.getElementById("shop_item_name_input").value;
    const itemCost = Number(document.getElementById("shop_item_cost_input").value);
    const itemDescription = document.getElementById("shop_item_description_input").value;

    await updateDoc(doc(db, "shop", shopItemID), {
        name: itemName, 
        cost: itemCost, 
        description: itemDescription
    });

    removePopup();
}

async function editLeaderboard(leaderboardID, previousUIPosition) {
    const leaderboardName = document.querySelector("#leaderboard_popup_name_input").value;
    const leaderboardSlots = Number(document.querySelector("#leaderboard_popup_slots_input").value);
    const UIPosition = document.querySelector("input[name='leaderboard_popup_place_input']:checked").value;
    const reasonFilter = document.querySelector("input[name='leaderboard_popup_reason_filter_input']:checked").value;

    let beltFilters = [];

    // Belt filters editor
    belts.forEach(belt => {
        if (document.querySelector(`#leaderboard_popup_${belt}_belt_input`).checked) {
            beltFilters.push(belts.indexOf(belt));
        }
    });

    await updateDoc(doc(db, "leaderboards", leaderboardID), {
        name: leaderboardName, 
        slots: leaderboardSlots, 
        belt_filters: beltFilters, 
        reason_filter: reasonFilter, 
        ui_position: UIPosition
    });

    if (UIPosition != previousUIPosition) {
        await updateDoc(doc(db, "settings", "leaderboard"), {
            taken_ui_positions: arrayRemove(previousUIPosition)
        });

        await updateDoc(doc(db, "settings", "leaderboard"), {
            taken_ui_positions: arrayUnion(UIPosition)
        });
    }

    removePopup();
}

async function loadPage() {
    // Load Ninjas
    onSnapshot(collection(db, "ninjas"), (snapshot) => {
        snapshot.docChanges().forEach((ninja) => {
            const value = ninja.doc.data();

            switch (ninja.type) {
                case "added":
                    // Create DOM
                    let ninjaElement = document.createElement("div");
                    ninjaElement.classList.add("registered_ninja");

                    let name = createElementHelper("h3", "ninja_name", `${value.firstname} ${value.lastname}`);
                    ninjaElement.appendChild(name);
                    
                    let points = createElementHelper("p", "ninja_points", `Points: ${value.points}`);
                    ninjaElement.appendChild(points);

                    let uid = createElementHelper("p", "ninja_uid", `UID: ${ninja.doc.id}`);
                    ninjaElement.appendChild(uid);

                    let add_session = createEmptyButtonHelper("Add Session");
                    ninjaElement.appendChild(add_session);

                    let custom_btn_del = createEmptyButtonHelper("Remove Ninja");
                    ninjaElement.appendChild(custom_btn_del);

                    // Add event listeners
                    add_session.addEventListener("click", async (event) => {
                        showSessionPopup(ninja.doc.id);
                    });

                    custom_btn_del.addEventListener("click", async (event) => {
                        showConfirmDeletePopup(async () => await deleteNinja(ninja.doc.id), "Are you sure you want to delete this Ninja?");
                    });

                    // Save value for editing purposes
                    ninjas[ninja.doc.id] = value;

                    // Add to DOM
                    ninjaElements[ninja.doc.id] = ninjaElement;
                    ninjaContainer.appendChild(ninjaElement);
                    break;
                case "modified":
                    ninjaElements[ninja.doc.id].querySelector(".ninja_name").textContent = `${value.firstname} ${value.lastname}`;
                    ninjaElements[ninja.doc.id].querySelector(".ninja_points").textContent = `Points: ${value.points}`;
                    ninjaElements[ninja.doc.id].querySelector(".ninja_uid").textContent = `UID: ${ninja.doc.id}`;

                    // Update value for editing purposes
                    ninjas[ninja.doc.id] = value;

                    break;
                case "removed":
                    ninjaContainer.removeChild(ninjaElements[ninja.doc.id]);
                    delete ninjaElements[ninja.doc.id];
                    break;
            }
        });
    });

    // Load Shop Editor
    onSnapshot(collection(db, "shop"), (snapshot) => {
        snapshot.docChanges().forEach((shopItem) => {
            const value = shopItem.doc.data();

            switch (shopItem.type) {
                case "added":
                    let item = document.createElement("div");
                    item.classList.add("shop_item");

                    let name = createElementHelper("h3", "shop_item_name", `${value.name}`);
                    item.appendChild(name);
                    
                    let cost = createElementHelper("p", "shop_item_cost", `Cost: ${value.cost} points`);
                    item.appendChild(cost);

                    let description = createElementHelper("p", "shop_item_description", `Description: ${value.description}`);
                    item.appendChild(description);

                    let edit_button = createEmptyButtonHelper("Edit");
                    item.appendChild(edit_button);

                    let delete_button = createEmptyButtonHelper("Delete");
                    item.appendChild(delete_button);

                    // Add event listeners
                    edit_button.addEventListener("click", async (event) => {
                        showShopPopup("edit", shopItem.doc.id);
                    });

                    delete_button.addEventListener("click", async (event) => {
                        showConfirmDeletePopup(async () => await removeShopItem(shopItem.doc.id), "Are you sure you want to delete this shop item?");
                    });

                    // Save value for editing purposes
                    shop[shopItem.doc.id] = value;

                    shopElements[shopItem.doc.id] = item;
                    shopEditorContainer.appendChild(item);
                    break;
                case "modified":
                    shopElements[shopItem.doc.id].querySelector(".shop_item_name").textContent = `${value.name}`;
                    shopElements[shopItem.doc.id].querySelector(".shop_item_cost").textContent = `Cost: ${value.cost} points`;
                    shopElements[shopItem.doc.id].querySelector(".shop_item_description").textContent = `Description: ${value.description}`;

                    // Update value for editing purposes
                    shop[shopItem.doc.id] = value;

                    break;
                case "removed":
                    shopEditorContainer.removeChild(shopElements[shopItem.doc.id]);
                    delete shopElements[shopItem.doc.id];
                    break;
            }
        });
    });

    // Load Leaderboards
    onSnapshot(collection(db, "leaderboards"), (snapshot) => {
        snapshot.docChanges().forEach((leaderboard) => {
            const value = leaderboard.doc.data();

            switch (leaderboard.type) {
                case "added":
                    let item = document.createElement("div");
                    item.classList.add("leaderboard");

                    let name = createElementHelper("h3", "leaderboard_name", `${value.name}`);
                    item.appendChild(name);

                    let slots = createElementHelper("p", "leaderboard_slots", `Slots: ${value.slots}`);
                    item.appendChild(slots);

                    let beltFilterText = "Belts: ";
                    value.belt_filters.forEach(filter => {
                        beltFilterText += `${belts[filter]}, `;
                    });
                    beltFilterText = beltFilterText.replace(/[\s,]+$/, '');
                    let beltFilters = createElementHelper("p", "leaderboard_belt_filters", beltFilterText);
                    item.appendChild(beltFilters);

                    let reasonFilters = createElementHelper("p", "leaderboard_reason_filters", `Reason Filter: ${lang[value.reason_filter]} points`);
                    item.appendChild(reasonFilters);

                    let UIPlace = createElementHelper("p", "leaderboard_ui_place", "UI position: " + lang[value.ui_position]);
                    item.appendChild(UIPlace);

                    let edit_button = createEmptyButtonHelper("Edit");
                    item.appendChild(edit_button);

                    let delete_button = createEmptyButtonHelper("Delete");
                    item.appendChild(delete_button);

                    // Add event listeners
                    edit_button.addEventListener("click", async (event) => {
                        showLeaderboardPopup("edit", leaderboard.doc.id);
                    });

                    delete_button.addEventListener("click", async (event) => {
                        showConfirmDeletePopup(async () => removeLeaderboard(leaderboard.doc.id), "Are you sure you want to delete this leaderboard?");
                    });

                    // Save value for editing purposes
                    leaderboards[leaderboard.doc.id] = value;

                    leaderboardElements[leaderboard.doc.id] = item;
                    leaderboardEditorContainer.appendChild(item);
                    break;
                case "modified":
                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_name").textContent = `${value.name}`;
                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_slots").textContent = `Slots: ${value.slots}`;

                    let updatedBeltFilterText = "Belts: ";
                    value.belt_filters.forEach(filter => {
                        updatedBeltFilterText += `${belts[filter]}, `;
                    });
                    updatedBeltFilterText = updatedBeltFilterText.replace(/[\s,]+$/, '');
                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_belt_filters").textContent = updatedBeltFilterText;

                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_reason_filters").textContent = `Reason Filter: ${lang[value.reason_filter]} points`;

                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_ui_place").textContent = "UI position: " + lang[value.ui_position];

                    // Update value for editing purposes
                    leaderboards[leaderboard.doc.id] = value;

                    break;
                case "removed":
                    leaderboardEditorContainer.removeChild(leaderboardElements[leaderboard.doc.id]);
                    delete leaderboardElements[leaderboard.doc.id];
                    break;
            }
        });
    });

    // Update the taken UI slots for leaderboards
    onSnapshot(doc(db, "settings", "leaderboard"), (snapshot) => {
        takenUIPositions = snapshot.data().taken_ui_positions;
    });

    addShopItemButton.addEventListener("click", async (event) => {
        showShopPopup("add");
    })

    addLeaderboardButton.addEventListener("click", async (event) => {
        showLeaderboardPopup("add");
    })
}

async function editPoints(ninja, amount) {
    await updateDoc(doc(db, "ninjas", ninja), {
        points: increment(amount), 
        total_history_points: increment(amount)
    });
}

async function deleteNinja(ninja) {
    await deleteDoc(doc(db, "ninjas", ninja));
}

async function removeShopItem(itemID) {
    await deleteDoc(doc(db, "shop", itemID));
}

async function removeLeaderboard(itemID) {
    await updateDoc(doc(db, "settings", "leaderboard"), {
        taken_ui_positions: arrayRemove(leaderboards[itemID].ui_position)
    });

    await deleteDoc(doc(db, "leaderboards", itemID));
}

// Start app
loadPage();

/*
Admin panel needs to:
- See all registered members
- add points to members

POINT GUIDE (ROUGH DRAFT)
Level up: 10 points
Belt up: 100 points
*/