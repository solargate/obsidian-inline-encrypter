import { Editor, MarkdownView, Notice, Plugin, MarkdownPostProcessorContext } from 'obsidian';

import { InlineEncrypterSettings, DEFAULT_SETTINGS, InlineEncrypterSettingTab } from 'Settings';
import { ModalPassword } from 'ModalPassword';
import { ModalDecrypt } from 'ModalDecrypt';
import { CryptoFactory } from 'CryptoFactory';
import { ENCRYPTED_CODE_PREFIX } from 'Constants'

export default class InlineEncrypterPlugin extends Plugin {
	settings: InlineEncrypterSettings;
	cryptoFactory = new CryptoFactory(16, 16, 262144);

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new InlineEncrypterSettingTab(this.app, this));

		this.registerMarkdownPostProcessor((el,ctx) => this.processEncryptedCodeBlockProcessor(el, ctx));

		this.addCommand({
			id: 'encrypt-command',
			name: 'Encrypt selected text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor)
		});

		this.addCommand({
			id: 'decrypt-command',
			name: 'Decrypt selected text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineDecryptCommand(editor)
		});

		console.log('Inline Encrypter plugin loaded')
	}

	onunload() {
		console.log('Inline Encrypter plugin unloaded')
	}

	async loadSettings() {
		//this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		//await this.saveData(this.settings);
	}

    private async processInlineEncryptCommand(editor: Editor) {
        if (editor.somethingSelected()) {
			const input = editor.getSelection();

			const passModal = new ModalPassword(this.app);
			passModal.onClose = async () => {
				if (!passModal.isPassword) {
					return;
				}			
				const output = await this.cryptoFactory.encryptToBase64(input, passModal.password);
				editor.replaceSelection('`' + ENCRYPTED_CODE_PREFIX + output + '`');
				new Notice('✅ Text encrypted')
			}
			passModal.open();
        } else {
			new Notice('❌ No selected text for encryption');
		}
    }

    private async processInlineDecryptCommand(editor: Editor) {
		if (editor.somethingSelected()) {
			let input = editor.getSelection();
			const passModal = new ModalPassword(this.app);
			passModal.onClose = async () => {
				if (!passModal.isPassword) {
					return;
				}			
				input = input.replace('`', '').replace(ENCRYPTED_CODE_PREFIX, '').replace('`', '');
				const output = await this.cryptoFactory.decryptFromBase64(input, passModal.password);
				if (output === null) {
					new Notice('❌ Decryption failed!');
					return;
				} else {
					editor.replaceSelection(output);
					new Notice('✅ Text decrypted')
				}
			}
			passModal.open();
		} else {
			new Notice('❌ No selected text for decryption');
		}
    }

	private processEncryptedCodeBlockProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const codeblocks = el.querySelectorAll('code');

		for (let i = 0; i < codeblocks.length; i++) {
			const codeblock = codeblocks.item(i);
			const text = codeblock.innerText.trim();
			const isEncrypted = text.indexOf(ENCRYPTED_CODE_PREFIX) === 0;
  
			if (isEncrypted) {
				codeblock.innerText = ''
				codeblock.createEl('a', {cls: 'inline-encrypter-code'});
				codeblock.onClickEvent((event: MouseEvent) => this.handleDecryptClick(event, text));
		  	}
		}
	}

	private handleDecryptClick(event: MouseEvent, input: string) {
		event.preventDefault();

		const passModal = new ModalPassword(this.app);
		passModal.onClose = async () => {
			if (!passModal.isPassword) {
				return;
			}			
			input = input.replace(ENCRYPTED_CODE_PREFIX, '');
			const output = await this.cryptoFactory.decryptFromBase64(input, passModal.password);
			if (output === null) {
				new Notice('❌ Decryption failed!');
				return;
			} else {
				new ModalDecrypt(this.app, output).open();
			}
		}
		passModal.open();
	}

}
