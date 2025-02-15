import { App, Modal, Setting, TextAreaComponent } from 'obsidian';

import { EncryptedTextType } from 'Constants';

export class ModalPassword extends Modal {
	password: string;
	input: string;
	isPassword: boolean;
	textType: EncryptedTextType;

	constructor(app: App, textType: EncryptedTextType) {
		super(app);
		this.password = '';
		this.input = '';
		this.textType = textType;
	}

	onOpen() {
		const {contentEl} = this;
		let textArea: TextAreaComponent;

		if (this.textType === EncryptedTextType.PreEncrypted) {
			contentEl.createEl("h1", {text: "Enter password and text for encryption"});
		}
		else {
			contentEl.createEl("h1", {text: "Enter password"});
		}

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

		if (this.textType === EncryptedTextType.PreEncrypted) {
			contentEl.classList.add('inline-encrypter-encrypt-text-modal');
			new Setting(contentEl).setName("Text to encrypt").addTextArea(cb => {
				textArea = cb;
				cb.setValue(this.input);
				cb.inputEl.readOnly = false;
				cb.inputEl.cols = 30
				cb.inputEl.rows = 10;
			})
		}

		new Setting(contentEl).addButton((btn) => 
			btn.setButtonText("OK").setCta().onClick(() => {
				if (this.textType === EncryptedTextType.PreEncrypted) {
					this.input = textArea.getValue();
				}
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
