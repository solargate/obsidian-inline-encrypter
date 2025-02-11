import { App, Modal, Setting } from 'obsidian';

export class ModalPassword extends Modal {
	password: string;
	isPassword: boolean;

	constructor(app: App) {
		super(app);
		this.password = '';
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "Enter password"});

		new Setting(contentEl).setName("Password").addText((text) => {
			text.inputEl.type = 'password';
			text.inputEl.addEventListener("keypress", (event) => {
				if (event.key === 'Enter') {
					this.passwordOk();
				}
			});
			text.onChange((value) => this.password = value);
		});

		new Setting(contentEl).setName("Show password").addToggle((toggle) =>
			toggle.setValue(false).onChange((value) => {
				const input = this.contentEl.querySelector("input");
				if (input) {
					input.type = value ? 'text' : 'password';
				}
			})
		);
		
		new Setting(contentEl).addButton((btn) => 
			btn.setButtonText("OK").setCta().onClick(() => {
				this.passwordOk();
			}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	passwordOk() {
		this.isPassword = true;
		this.close();	
	}	
}
