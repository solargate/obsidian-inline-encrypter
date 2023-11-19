import { Editor, MarkdownView, Notice, Plugin, MarkdownPostProcessorContext } from 'obsidian';

import { ModalPassword } from 'ModalPassword';
import { CryptoFactory } from 'CryptoFactory';
import { UiHelper } from 'UiHelper';
import { livePreviewExtension } from 'LivePreviewExtension';
import { ENCRYPTED_CODE_PREFIX, CodeBlockType } from 'Constants';

export default class InlineEncrypterPlugin extends Plugin {
	cryptoFactory = new CryptoFactory();

	async onload() {
		this.registerMarkdownPostProcessor((el,ctx) => this.processEncryptedInlineCodeBlockProcessor(el, ctx));
		this.registerMarkdownCodeBlockProcessor(ENCRYPTED_CODE_PREFIX, (source, el,ctx) => this.processEncryptedCodeBlockProcessor(source, el, ctx));
		this.registerEditorExtension(livePreviewExtension(this.app));

		this.addCommand({
			id: 'encrypt',
			name: 'Encrypt selected text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor, CodeBlockType.Inline)
		});

		this.addCommand({
			id: 'encrypt-code',
			name: 'Encrypt selected text as code block',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor, CodeBlockType.Common)
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

    private async processInlineEncryptCommand(editor: Editor, codeBlockType: CodeBlockType) {
        if (editor.somethingSelected()) {
			const input = editor.getSelection();
			const passModal = new ModalPassword(this.app);
			passModal.onClose = async () => {
				if (!passModal.isPassword) {
					return;
				}
				const output = await this.cryptoFactory.encryptToBase64(input, passModal.password);
				if (codeBlockType === CodeBlockType.Inline) {
					editor.replaceSelection('`' + ENCRYPTED_CODE_PREFIX + ' ' + output + '`');
				}
				if (codeBlockType === CodeBlockType.Common) {
					editor.replaceSelection('```' + ENCRYPTED_CODE_PREFIX + '\n' + output + '\n```');
				}
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
				input = input.replace(ENCRYPTED_CODE_PREFIX, '').replace(/`/g, '').replace(/\s/g, '').replace(/\r?\n|\r/g, '');
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

	private processEncryptedInlineCodeBlockProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
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

	private processEncryptedCodeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const uiHelper = new UiHelper();
		const codeblock = el.createEl('a', {cls: 'inline-encrypter-code'});
		codeblock.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, event, source));
	}

}
