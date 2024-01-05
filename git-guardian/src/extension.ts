import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('gitguardian.run', () => {
		let command = `bash ${__dirname}/git-guardian.sh`;
		if (process.platform === "win32") {
			// Utiliser WSL sur Windows
			let windowsPath = `${__dirname}/git-guardian.sh`;
        	let wslPath = windowsPath.replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '/mnt/$1');
        	command = `wsl bash ${wslPath}`;
		}

		exec(command, (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage(`Error: ${err.message}`);
				return;
			}
			if (stdout.trim() === "ALERT") {
				vscode.window.showWarningMessage("⚠️ Time to version your changes! Starting a 30-second countdown...");
				let counter = 30;
				let interval = setInterval(() => {
					vscode.window.setStatusBarMessage(`⚠️ Git Guardian: ${counter} seconds remaining...`, 1000);
					counter--;
					if (counter === 0) {
						clearInterval(interval);
						vscode.window.showErrorMessage("Time's up! Auto-cleaning unversioned changes.");
						exec('git reset --hard && git clean -fd');
					}
				}, 1000);
			} else if (stdout.trim() === "GIT_NOT_INSTALLED") {
				vscode.window.showErrorMessage("Git is not installed. Please install Git to use Git Guardian.");
			} else {
				vscode.window.showInformationMessage("All is well, continue your work.");
			}
		});
	});

	context.subscriptions.push(disposable);
}