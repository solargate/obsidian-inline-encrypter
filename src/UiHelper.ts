import { App, Notice } from "obsidian";
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
		const cryptoFactory = new CryptoFactory();
		const passModal = new ModalPassword(app, EncryptedTextType.Inline);
		passModal.onClose = async () => {
			if (!passModal.isPassword) {
				return;
			}
			input = input.replace(ENCRYPTED_CODE_PREFIX, '').replace(/`/g, '').replace(/\s/g, '').replace(/\r?\n|\r/g, '');
			const output = await cryptoFactory.decryptFromBase64(input, passModal.password);
			if (output === null) {
				new Notice('❌ Decryption failed!');
				saveStatePasswordGlobal('');
				return;
			}
			if (event.ctrlKey) {
				try {
					await navigator.clipboard.writeText(output);
					new Notice('Secret copied');
				} catch (e) {
					new Notice('Failed to copy to clipboard');
				}
			} else {
				new ModalDecrypt(app, output, plugin.settings.autoCopy).open();
			}
		}
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
