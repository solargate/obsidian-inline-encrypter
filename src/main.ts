import { Editor, MarkdownView, Notice, Plugin, MarkdownPostProcessorContext } from 'obsidian';

import { InlineEncrypterPluginSettings, InlineEncrypterSettingTab, DEFAULT_SETTINGS} from 'Settings';
import { ModalPassword } from 'ModalPassword';
import { CryptoFactory } from 'CryptoFactory';
import { UiHelper } from 'UiHelper';
import { livePreviewExtension } from 'LivePreviewExtension';
import { ENCRYPTED_CODE_PREFIX, CodeBlockType, EncryptedTextType } from 'Constants';

export default class InlineEncrypterPlugin extends Plugin {
	settings: InlineEncrypterPluginSettings;
	cryptoFactory = new CryptoFactory();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new InlineEncrypterSettingTab(this.app, this));

		this.registerMarkdownPostProcessor((el,ctx) => this.processEncryptedInlineCodeBlockProcessor(el, ctx));
		this.registerMarkdownCodeBlockProcessor(ENCRYPTED_CODE_PREFIX, (source, el,ctx) => this.processEncryptedCodeBlockProcessor(source, el, ctx));
		this.registerEditorExtension(livePreviewExtension(this.app, this));

		this.addCommand({
			id: 'encrypt',
			name: 'Encrypt selected text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor, CodeBlockType.Inline, EncryptedTextType.Inline)
		});

		this.addCommand({
			id: 'encrypt-code',
			name: 'Encrypt selected text as code block',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor, CodeBlockType.Common, EncryptedTextType.Inline)
		});

		this.addCommand({
			id: 'encrypt-pre',
			name: 'Insert pre-encrypted text',
			icon: 'lock',
			editorCallback: (editor: Editor, view: MarkdownView) => this.processInlineEncryptCommand(editor, CodeBlockType.Inline, EncryptedTextType.PreEncrypted)
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    private async processInlineEncryptCommand(editor: Editor, codeBlockType: CodeBlockType, textType: EncryptedTextType) {
		if (textType === EncryptedTextType.Inline) {
			if (editor.somethingSelected()) {
				const input = editor.getSelection();
				const passModal = new ModalPassword(this.app, textType);
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
		if (textType === EncryptedTextType.PreEncrypted) {
			const passModal = new ModalPassword(this.app, textType);
			passModal.onClose = async () => {
				const input = passModal.input;
				if (input.length > 0) {
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
				else {
					new Notice('❌ No text for encryption');	
				}
			}
			passModal.open();		
		}
    }

    private async processInlineDecryptCommand(editor: Editor) {
		if (editor.somethingSelected()) {
			let input = editor.getSelection();
			const passModal = new ModalPassword(this.app, EncryptedTextType.Inline);
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
				codeblock.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, this, event, text));
			}
		}
	}

	private processEncryptedCodeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const uiHelper = new UiHelper();
		const codeblock = el.createEl('a', {cls: 'inline-encrypter-code'});
		codeblock.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, this, event, source));
	}

}
