import { App, Modal, Setting, TextAreaComponent, Notice } from 'obsidian';

export class ModalDecrypt extends Modal {
    text: string;
	autoCopy: boolean;

	constructor(app: App, text = '', autoCopy: boolean) {
		super(app);
        this.text = text;
		this.autoCopy = autoCopy;
	}

	onOpen() {
		const {contentEl} = this;

        contentEl.empty();
        contentEl.classList.add('inline-encrypter-decrypt-modal');

        contentEl.createEl("h1", {text: "Decrypted secret"});

		let textArea: TextAreaComponent;
		const textVal = new Setting(contentEl).addTextArea(cb => {
            textArea = cb;
            cb.setValue(this.text);
            cb.inputEl.setSelectionRange(0,0)
            cb.inputEl.readOnly = true;
			cb.inputEl.cols = 50
            cb.inputEl.rows = 10;
			if (this.autoCopy == true) {
				navigator.clipboard.writeText( textArea.getValue());
				new Notice('Secret copied');
			}
		})
        textVal.settingEl.querySelector('.setting-item-info')?.remove();

		const buttons = new Setting(contentEl);
		buttons.addButton( cb => {
			cb.setButtonText('Copy to clipboard').onClick(evt => {
				navigator.clipboard.writeText( textArea.getValue());
				new Notice('Secret copied');
			});
		});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
