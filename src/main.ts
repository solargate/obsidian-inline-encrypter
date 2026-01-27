import { Editor, MarkdownView, Notice, Plugin, MarkdownPostProcessorContext } from 'obsidian';

import { InlineEncrypterPluginSettings, InlineEncrypterSettingTab, DEFAULT_SETTINGS} from 'Settings';
import { ModalPassword } from 'ModalPassword';
import { CryptoFactory } from 'CryptoFactory';
import { UiHelper } from 'UiHelper';
import { livePreviewExtension } from 'LivePreviewExtension';
import { ENCRYPTED_CODE_PREFIX, CodeBlockType, EncryptedTextType, MouseButton } from 'Constants';
import { saveStatePasswordGlobal, saveStatePasswordRemember } from 'Globals';

export default class InlineEncrypterPlugin extends Plugin {
	settings: InlineEncrypterPluginSettings;
	cryptoFactory = new CryptoFactory();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new InlineEncrypterSettingTab(this.app, this));
		saveStatePasswordRemember(this.settings.rememberPassword);

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
					saveStatePasswordGlobal('');
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
		const uiHelper = new UiHelper();

		const codes = el.querySelectorAll('code');
		if (!codes || codes.length === 0) return;

		codes.forEach((codeEl) => {
			const raw = (codeEl.textContent || '').trim();
			if (!raw || !raw.startsWith(ENCRYPTED_CODE_PREFIX)) return;

			codeEl.innerText = '';
			const btn = codeEl.createEl('a', {cls: 'inline-encrypter-code'});
			btn.dataset.secret = raw;

			btn.addEventListener('click', (ev: MouseEvent) => {
				if (ev.button !== MouseButton.Left) return;
				ev.preventDefault();
				uiHelper.handleDecryptClick(this.app, this, ev, btn.dataset.secret || '');
			});

			btn.addEventListener('contextmenu', (ev: MouseEvent) => {
				ev.preventDefault();
				ev.stopPropagation();
				ev.stopImmediatePropagation?.();
				setTimeout(() => uiHelper.openContextMenuAtEvent(this.app, this, ev, btn.dataset.secret || ''), 0);
			}, { capture: true });
		});
	}

	private processEncryptedCodeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const uiHelper = new UiHelper();

		const btn = el.createEl('a', {cls: 'inline-encrypter-code'});
		btn.dataset.secret = (source || '').trim();

		btn.addEventListener('click', (ev: MouseEvent) => {
			if (ev.button !== MouseButton.Left) return;
			ev.preventDefault();
			uiHelper.handleDecryptClick(this.app, this, ev, btn.dataset.secret || '');
		});

		btn.addEventListener('contextmenu', (ev: MouseEvent) => {
			ev.preventDefault();
			ev.stopPropagation();
			ev.stopImmediatePropagation?.();
			setTimeout(() => uiHelper.openContextMenuAtEvent(this.app, this, ev, btn.dataset.secret || ''), 0);
		}, { capture: true });
	}

}
