const nfcInput = document.querySelector("#nfc_input");

function convertInputToKey(inputValue) {
    return inputValue.replace(/[^a-fA-F0-9]/g, "");
}

nfcInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        if (e.target.value === "admin6699") {
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
setInterval(() => {nfcInput.focus()}, 500)