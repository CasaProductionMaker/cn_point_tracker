const nfcInput = document.getElementById("nfc_input");

function convertInputToKey(inputValue) {
    return inputValue.replace(/[^a-fA-F0-9]/g, "");
}

nfcInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        localStorage.setItem("currentUser", convertInputToKey(e.target.value))
        requestAnimationFrame(() => {
            document.getElementById("main_icon").style.bottom = "100vh"
            document.getElementById("title_text").style.top = "100vh"
            document.getElementById("main_icon").style.opacity = "0"
            document.getElementById("title_text").style.opacity = "0"
        })
        setTimeout(() => {
            window.location.href = "dashboard.html"
        }, 1000)
    }
})

nfcInput.value = "";
setInterval(() => {nfcInput.focus()}, 500)