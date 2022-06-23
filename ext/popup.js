const button = document.getElementById("changeStatus")

const changeStatus = (update = true) => {
    chrome.storage.sync.get("status", ({ status }) => {
        if (status === undefined) {
            status = false
        }
        if (update === false) {
            changeTitle(status)
        } else {
            status = ! status
            chrome.storage.sync.set({ status }, () => {
                changeTitle(status)
            })
        }
    });
}

changeTitle = (status) => {
    button.style.background = `url("../images/${status ? 'on' : 'off'}.png") no-repeat center center fixed`
}

button.addEventListener('click', () => {
    changeStatus()
})

changeStatus(false)
