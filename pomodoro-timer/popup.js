let updateInterval;
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const resetBtn = document.getElementById('reset');
const breakBtn = document.getElementById('start-break');

resetBtn.disabled = false;

startBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'start' });
    console.log("Start command sent");
    resetBtn.disabled = false;
    startUpdatingTimer();
});

stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'stop' });
    console.log("Stop command sent");
    resetBtn.disabled = false;
    stopUpdatingTimer();
});

resetBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'reset' });
    console.log("Reset command sent");
    resetBtn.disabled = true;
    breakBtn.style.display = 'none'; // Hide break button if visible
    startUpdatingTimer();
});

breakBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'start_break' });
    console.log("Start Break command sent");
    breakBtn.style.display = 'none'; // Hide after clicked
    resetBtn.disabled = false;
    startUpdatingTimer();
});

function startUpdatingTimer() {
    if (updateInterval) clearInterval(updateInterval);
    chrome.runtime.sendMessage({ command: 'get_time' });
    updateInterval = setInterval(() => {
        chrome.runtime.sendMessage({ command: 'get_time' });
    }, 1000);
}

function stopUpdatingTimer() {
    clearInterval(updateInterval);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.timer) {
        timerDisplay.textContent = message.timer;
    }
    if (message.showBreakButton) {
        breakBtn.style.display = 'inline-block'; // Show break button
    }
});

// Begin polling when popup opens
startUpdatingTimer();
