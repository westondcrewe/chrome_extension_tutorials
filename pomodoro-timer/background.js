let time = 25 * 60; // Set the timer to 25 minutes
let isRunning = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'start') {
        startTimer();
    } else if (message.command === 'stop') {
        stopTimer();
    } else if (message.command === 'reset') {
        resetTimer();
    } else if (message.command === 'get_time') {
        sendTimeUpdate();  // Send the current time to the popup when requested
    }
});

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        let alarmTime = Date.now() + time * 1000; // Calculate the alarm time in milliseconds
        chrome.alarms.create('pomodoroTimer', { when: alarmTime });
        countdown = setInterval(updateTime, 1000); // Update time every second in the popup
    }
}

function updateTime() {
    if (time > 0) {
        time--;
        sendTimeUpdate();  // Update the popup display
        if (time === 5) {
            chrome.windows.create({
                url: 'popup.html',
                type: 'popup',
                state: 'fullscreen',
                focused: true
            });
        }
    } else {
        completeTimer(); // Handle the completion of the timer
    }
}

function stopTimer() {
    clearInterval(countdown);
    chrome.alarms.clear('pomodoroTimer');
    isRunning = false;
}

function resetTimer() {
    clearInterval(countdown);
    chrome.alarms.clear('pomodoroTimer');
    time = 25 * 60;
    isRunning = false;
    sendTimeUpdate();  // Reset the popup display
}

function completeTimer() {
    clearInterval(countdown);
    isRunning = false;
    time = 25 * 60;
    sendTimeUpdate();  // Reset the popup display

    // Show the notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/timer-128.png',
        title: 'Time is up!',
        message: 'Take a break, your 25-minute session is complete.',
        requireInteraction: true,
        buttons: [
            { title: "Start Break" },
            { title: "Skip Break" }
        ],
        priority: 2
    });

    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
        if (buttonIndex === 0) { // Start Break
            time = 5 * 60; // Set time to 5 minutes for the break
            startTimer();
        } else if (buttonIndex === 1) { // Skip Break
            resetTimer(); // Reset the timer for a new 25-minute session
        }
    });
}

// Listen for the alarm to trigger
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroTimer') {
        completeTimer(); // Trigger the completion logic
    }
});

function sendTimeUpdate() {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    // Query the popup to see if it's open
    chrome.runtime.sendMessage({ timer: `${minutes}:${seconds}` }, response => {
        if (chrome.runtime.lastError) {
            // Error means no receiver (popup likely closed), do nothing
            console.log("Popup is closed, skipping update.");
        } else {
            // Response was received, popup is open
            console.log("Popup is open, update sent.");
        }
    });
}