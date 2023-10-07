import { App, Modal, Setting } from 'obsidian';

export class ModalPassword extends Modal {
	password: string;
	isPassword: boolean;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "Enter password"});

		new Setting(contentEl).setName("Password").addText((text) => {
			text.inputEl.type = 'password';
			text.onChange((value) => this.password = value);
		});
  
		new Setting(contentEl).addButton((btn) => 
			btn.setButtonText("OK").setCta().onClick(() => {
				this.isPassword = true;
				this.close();
			}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
