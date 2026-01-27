import { App, Notice, Menu } from "obsidian";
import { EditorSelection } from '@codemirror/state';

import InlineEncrypterPlugin from 'main';
import { ModalPassword } from 'ModalPassword';
import { ModalDecrypt } from 'ModalDecrypt';
import { CryptoFactory } from 'CryptoFactory';
import { ENCRYPTED_CODE_PREFIX, EncryptedTextType } from 'Constants';
import { saveStatePasswordGlobal } from 'Globals';

export class UiHelper {

	public handleDecryptClick(app: App, plugin: InlineEncrypterPlugin, event: MouseEvent, input: string) {
		event.preventDefault();
		const copyOnly = !!event.ctrlKey;
		this.decryptFlow(app, plugin, input, copyOnly);		
	}

	public openContextMenuAt(app: App, plugin: InlineEncrypterPlugin, pos: { x: number, y: number }, input: string) {
		const menu = new Menu();

		menu.addItem(item =>
			item
				.setTitle('Decrypt')
				.setIcon('lock-open')
				.onClick(() => this.decryptFlow(app, plugin, input, false))
		);

		menu.addItem(item =>
			item
				.setTitle('Decrypt and copy')
				.setIcon('copy')
				.onClick(() => this.decryptFlow(app, plugin, input, true))
		);

		menu.showAtPosition(pos);
	}

	private normalizeEncryptedInput(input: string): string {
		return input
			.replace(ENCRYPTED_CODE_PREFIX, '')
			.replace(/`/g, '')
			.replace(/\s/g, '')
			.replace(/\r?\n|\r/g, '');
	}

	private async decryptFlow(app: App, plugin: InlineEncrypterPlugin, input: string, copyOnly: boolean) {
		const cryptoFactory = new CryptoFactory();
		const passModal = new ModalPassword(app, EncryptedTextType.Inline);

		passModal.onClose = async () => {
			if (!passModal.isPassword) return;

			const cleaned = this.normalizeEncryptedInput(input);
			const output = await cryptoFactory.decryptFromBase64(cleaned, passModal.password);

			if (output === null) {
				new Notice('❌ Decryption failed!');
				saveStatePasswordGlobal('');
				return;
			}

			if (copyOnly) {
				try {
					await navigator.clipboard.writeText(output);
					new Notice('Secret copied');
				} catch {
					new Notice('Failed to copy to clipboard');
				}
			} else {
				new ModalDecrypt(app, output, plugin.settings.autoCopy).open();
			}
		};

		passModal.open();
	}

    public selectionAndRangeOverlap(selection: EditorSelection, rangeFrom: number, rangeTo: number) {
        for (const range of selection.ranges) {
            if (range.from <= rangeTo && range.to >= rangeFrom) {
                return true;
            }
        }
        return false;
    }    

}
