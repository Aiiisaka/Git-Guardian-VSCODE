import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	const checkGitStatus = () => {
		let command = `bash ${__dirname}/git-guardian.sh`;
		if (process.platform === "win32") {
			// Utiliser WSL sur Windows
			let windowsPath = `${__dirname}/git-guardian.sh`;
			let wslPath = windowsPath.replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '/mnt/$1');
			command = `wsl bash ${wslPath}`;
		}

		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage("Working folder not found, open a folder an try again.");
			return;
		}
		let options = { cwd: vscode.workspace.workspaceFolders[0].uri.fsPath };

		exec(command, options, (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage(`Error: ${err.message}`);
				return;
			}

			vscode.window.showInformationMessage(stdout);

			if (stdout.trim() === "ALERT") {
				vscode.window.showWarningMessage("⚠️ Time to version your changes! Starting a 30-second countdown...");

				let counter = 30;
				const interval = setInterval(() => {
					vscode.window.setStatusBarMessage(`⚠️ Git Guardian: ${counter} seconds remaining...`, 1000);
					counter--;
					if (counter === 0) {
						clearInterval(interval);
						exec(command, options, (err, stdout, stderr) => {
							if (stdout.trim() === "ALERT") {
								vscode.window.showErrorMessage("Time's up! Auto-cleaning unversioned changes.");
								exec('git reset --hard && git clean -fd');
							}
						});
					}
				}, 1000);

				setTimeout(() => {
					clearInterval(interval);
				}, 30000);
			} else if (stdout.trim() === "GIT_NOT_INSTALLED") {
				vscode.window.showErrorMessage("Git is not installed. Please install Git to use Git Guardian.");
			} else {
				vscode.window.showInformationMessage("All is well, continue your work.");
			}
		});
	};

	const interval = setInterval(checkGitStatus, 30000);

	let disposable = vscode.commands.registerCommand('gitguardian.run', () => {
		checkGitStatus();
	});

	context.subscriptions.push({
		dispose: () => {
			clearInterval(interval);
		}
	});
	context.subscriptions.push(disposable);
}