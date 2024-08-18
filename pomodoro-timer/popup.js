let updateInterval;
document.getElementById('reset').disabled = false;

document.getElementById('start').addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'start' });
    console.log("Start command sent");  
    startUpdatingTimer();
});

document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'stop' });
    console.log("Stop command sent");
    document.getElementById('reset').disabled = false;
    stopUpdatingTimer();
});

document.getElementById('reset').addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'reset' });
    console.log("Reset command sent");
    startUpdatingTimer();
});

function startUpdatingTimer() {
    // Clear any existing interval to avoid multiple intervals running
    if (updateInterval) clearInterval(updateInterval);

    // Request an immediate update and then start periodic updates
    chrome.runtime.sendMessage({ command: 'get_time' });
    updateInterval = setInterval(() => {
        chrome.runtime.sendMessage({ command: 'get_time' });
    }, 1000);
}

function stopUpdatingTimer() {
    // Clear the interval to stop requesting updates
    clearInterval(updateInterval);
}

startUpdatingTimer();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.timer) {
        document.getElementById('timer').textContent = message.timer;
    }
});