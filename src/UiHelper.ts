import { App, Notice } from "obsidian";
import { EditorSelection } from '@codemirror/state';

import { ModalPassword } from 'ModalPassword';
import { ModalDecrypt } from 'ModalDecrypt';
import { CryptoFactory } from 'CryptoFactory';
import { ENCRYPTED_CODE_PREFIX } from 'Constants';

export class UiHelper {

	public handleDecryptClick(app: App, event: MouseEvent, input: string) {
		event.preventDefault();
		const cryptoFactory = new CryptoFactory();
		const passModal = new ModalPassword(app);
		passModal.onClose = async () => {
			if (!passModal.isPassword) {
				return;
			}
			input = input.replace(ENCRYPTED_CODE_PREFIX, '').replace(/`/g, '').replace(/\s/g, '').replace(/\r?\n|\r/g, '');
			const output = await cryptoFactory.decryptFromBase64(input, passModal.password);
			if (output === null) {
				new Notice('❌ Decryption failed!');
				return;
			} else {
				new ModalDecrypt(app, output).open();
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
