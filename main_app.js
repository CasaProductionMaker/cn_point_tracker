import { convertInputToKey } from "./util.js";

const nfcInput = document.querySelector("#nfc_input");
let currentInterval = null;

nfcInput.addEventListener("keydown", (e) => {
    clearInterval(currentInterval);
    currentInterval = setInterval(() => {nfcInput.focus()}, 500);
    if (e.key == "Enter") {
        if (e.target.value === "admin6699") {
            localStorage.setItem("isAdminSignedIn", true);
            window.location.href = "admin_panel.html";
            return;
        }
        localStorage.setItem("currentUser", convertInputToKey(e.target.value))
        nfcInput.style.visibility = "hidden";
        requestAnimationFrame(() => {
            document.querySelector("#main_icon").style.bottom = "100vh"
            document.querySelector("#title_text").style.top = "100vh"
            document.querySelector("#main_icon").style.opacity = "0"
            document.querySelector("#title_text").style.opacity = "0"
        })
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000)
    }
})

nfcInput.value = "";
currentInterval = setInterval(() => {nfcInput.focus()}, 500);

const adminInput = document.querySelector("#admin-input");
const adminDialogue = document.querySelector("#dialog_admin_pw");
adminDialogue.close();
const adminInputPara = document.querySelector("#admin-incorrect-pw");
adminInput.addEventListener("keydown", (e) => {
    clearInterval(currentInterval);
    currentInterval = null;
    if ((e.key == "Enter") && (e.target.value === "admin6699")) {
        console.log("noo")
        localStorage.setItem("isAdminSignedIn", true);
        window.location.href = "admin_panel.html";
        return; 
    } else if (e.key == "Enter") {
        adminInputPara.textContent='Password is incorrect.';
    }
});

