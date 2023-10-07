import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

import { InlineEncrypterModal } from 'modal';
import { InlineEncrypterSettings, DEFAULT_SETTINGS, InlineEncrypterSettingTab } from 'Settings';
import { CryptoFactory } from 'CryptoFactory';

export default class InlineEncrypterPlugin extends Plugin {
	settings: InlineEncrypterSettings;
	cryptoFactory = new CryptoFactory(16, 16, 210000);

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new InlineEncrypterSettingTab(this.app, this));

		//this.registerMarkdownPostProcessor((el,ctx) => this.processEncryptedCodeBlockProcessor(el, ctx));

		this.addCommand({
			id: 'inline-encrypter-encrypt-command',
			name: 'Inline encrypt',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processEncryptCommand(editor)
		});

		this.addCommand({
			id: 'inline-encrypter-decrypt-command',
			name: 'Inline decrypt',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processDecryptCommand(editor)
		});

		console.log('Inline Encrypter plugin loaded')
	}

	onunload() {
		console.log('Inline Encrypter plugin unloaded')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    private async processEncryptCommand(editor: Editor) {
        console.log(editor.getSelection());

		const input = editor.getSelection();

		const output = await this.cryptoFactory.encryptToBase64(input, "test");

        if (editor.somethingSelected()) {
            editor.replaceSelection(output);
			new Notice('✅ Text encrypted')
        }
    }

    private async processDecryptCommand(editor: Editor) {
        console.log(editor.getSelection());

		const input = editor.getSelection();

		const output = await this.cryptoFactory.decryptFromBase64(input, "test");

		if (output === null) {
			new Notice('❌ Decryption failed!');
			return false;
		} else {
			editor.replaceSelection(output);
			new Notice('✅ Text decrypted')
		}
    }
	
}
