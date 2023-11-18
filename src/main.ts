import { Editor, MarkdownView, Notice, Plugin, MarkdownPostProcessorContext } from 'obsidian';

import { ModalPassword } from 'ModalPassword';
import { CryptoFactory } from 'CryptoFactory';
import { UiHelper } from 'UiHelper';
import { livePreviewExtension } from 'LivePreviewExtension';
import { ENCRYPTED_CODE_PREFIX } from 'Constants';

export default class InlineEncrypterPlugin extends Plugin {
	cryptoFactory = new CryptoFactory();

	async onload() {
		this.registerMarkdownPostProcessor((el,ctx) => this.processEncryptedCodeBlockProcessor(el, ctx));
		this.registerEditorExtension(livePreviewExtension(this.app));

		this.addCommand({
			id: 'encrypt',
			name: 'Encrypt selected text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor)
		});

		this.addCommand({
			id: 'decrypt',
			name: 'Decrypt selected text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineDecryptCommand(editor)
		});

		console.log('Inline Encrypter plugin loaded')
	}

	onunload() {
		console.log('Inline Encrypter plugin unloaded')
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
				if (passModal.password.length === 0) {
					new Notice('⚠️ Password is empty');
				}
				new Notice('✅ Text encrypted');				
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
				const uiHelper = new UiHelper();
				codeblock.innerText = ''
				codeblock.createEl('a', {cls: 'inline-encrypter-code'});
				codeblock.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, event, text));
			}
		}
	}

}
