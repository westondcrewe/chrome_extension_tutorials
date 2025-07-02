let time = 25 * 60; // Set the timer to 25 minutes
let isRunning = false;
let mode = "work"; // or "break"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'start') {
        startTimer();
    } else if (message.command === 'stop') {
        stopTimer();
    } else if (message.command === 'reset') {
        resetTimer();
    } else if (message.command === 'get_time') {
        sendTimeUpdate();  // Send the current time to the popup when requested
    } else if (message.command === 'start_break') {
        time = 5 * 60;
        mode = "break";
        startTimer();
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

    if (mode === "work") {
        // End of a Pomodoro session
        time = 25 * 60;
        sendTimeUpdate();

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
        }, (notificationId) => {
            chrome.notifications.onButtonClicked.addListener(function onWorkSessionEnd(id, buttonIndex) {
                if (id === notificationId) {
                    if (buttonIndex === 0) {
                        time = 5 * 60;
                        mode = "break";
                        startTimer();
                    } else if (buttonIndex === 1) {
                        time = 25 * 60;
                        mode = "work";
                        sendTimeUpdate();
                    }
                    chrome.notifications.onButtonClicked.removeListener(onWorkSessionEnd);
                }
            });
        });

        // Also update popup if open
        chrome.runtime.sendMessage({ showBreakButton: true });

    } else if (mode === "break") {
        // End of break session
        time = 25 * 60;
        mode = "work";
        sendTimeUpdate();

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/timer-128.png',
            title: 'Break over!',
            message: 'Time to start your next Pomodoro session.',
            requireInteraction: true,
            buttons: [{ title: "Start Next Pomodoro" }],
            priority: 2
        }, (notificationId) => {
            chrome.notifications.onButtonClicked.addListener(function onBreakEnd(id, buttonIndex) {
                if (id === notificationId && buttonIndex === 0) {
                    startTimer();
                    chrome.notifications.onButtonClicked.removeListener(onBreakEnd);
                }
            });
        });
    }
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