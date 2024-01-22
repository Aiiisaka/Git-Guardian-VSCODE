import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	const checkGitStatus = () => {
		const isWindows = process.platform === 'win32';
		const scriptPath = isWindows
			? `powershell.exe -ExecutionPolicy RemoteSigned -Command ${__dirname.replace(/\\/g, '/')}/git-guardian.ps1`
			: `chmod +x ${__dirname}/git-guardian.sh`;

        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage("Working folder not found, open a folder and try again.");
            return;
        }

		let options = { cwd: vscode.workspace.workspaceFolders[0].uri.fsPath };

		exec(`${scriptPath}`, options, (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage(`Error: ${err.message}`);
				return;
			}

			if (stdout.trim() === "ALERT") {
				vscode.window.showWarningMessage("Time to version your changes! Starting a 30-second countdown...");

				let counter = 30;
				const intervalCount = setInterval(() => {
					vscode.window.setStatusBarMessage(`⚠️ Git Guardian: ${counter} seconds remaining...`, 1000);
					counter--;

					if (counter === 0) {
						vscode.window.setStatusBarMessage(`⚠️ Git Guardian: Time's up!`, 1000);
						clearInterval(intervalCount);

						exec(scriptPath, options, (err, stdout, stderr) => {
							if (err) {
								vscode.window.showErrorMessage(`Error: ${err.message}`);
								return;
							}
							
							if (stdout.trim() === "ALERT") {
								exec('git reset --hard && git clean -fd', options, (err, stdout, stderr) => {
									if (err) {
										vscode.window.showErrorMessage(`Error: ${err.message}`);
										return;
									}

									vscode.window.showErrorMessage("Time's up! Auto-cleaning unversioned changes.");
								});
							} else {
								vscode.window.showInformationMessage("All is well, continue your work.");
							}
						});
					}
				}, 1000);
			} else if (stdout.trim() === "GIT_NOT_INSTALLED") {
				vscode.window.showErrorMessage("Git is not installed. Please install Git to use Git Guardian.");
			} else {
				vscode.window.showInformationMessage("All is well, continue your work.");
			}
		});
	};

	const interval = setInterval(checkGitStatus, 60000);

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