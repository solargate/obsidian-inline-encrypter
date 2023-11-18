export class CryptoFactory {

	private vectorSize: number;
	private saltSize: number;
	private iterations: number;

	constructor() {
		this.vectorSize = 16;
		this.saltSize = 16;
		this.iterations = 262144;
	}

	private convertArrayToString(bytes: Uint8Array): string {
		let result = '';
		for (let i = 0; i < bytes.length; i++) {
			result += String.fromCharCode(bytes[i]);
		}
		return result;
	}

	private convertStringToArray(str: string): Uint8Array {
		const result = [];
		for (let i = 0; i < str.length; i++) {
			result.push(str.charCodeAt(i));
		}
		return new Uint8Array(result);
	}

	private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const utf8Encoder = new TextEncoder();
		const keyData     = utf8Encoder.encode(password);
		const key         = await crypto.subtle.importKey('raw', keyData, {name: 'PBKDF2'}, false, ['deriveKey']);
		const privateKey  = await crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				hash: {name: 'SHA-512'},
                salt: salt,
				iterations: this.iterations
			},
			key,
			{
				name: 'AES-GCM',
				length: 256
			},
			false,
			['encrypt', 'decrypt']
		);		
		return privateKey;
	}

	private async encryptToBytes(text: string, password: string): Promise<Uint8Array> {
		const salt = crypto.getRandomValues(new Uint8Array(this.saltSize));
		const key = await this.deriveKey(password, salt);		
		const utf8Encoder = new TextEncoder();
		const textBytesToEncrypt = utf8Encoder.encode(text);
		const vector = crypto.getRandomValues(new Uint8Array(this.vectorSize));
		const encryptedBytes = new Uint8Array(
			await crypto.subtle.encrypt(
                {
					name: 'AES-GCM',
					iv: vector
				},
				key,
				textBytesToEncrypt
			)
		);
		const finalBytes = new Uint8Array(vector.byteLength + salt.byteLength + encryptedBytes.byteLength);
		finalBytes.set(vector, 0);
		finalBytes.set(salt, vector.byteLength);
		finalBytes.set(encryptedBytes, vector.byteLength + salt.byteLength);
		return finalBytes;
	}

	public async encryptToBase64(text: string, password: string): Promise<string> {
		const finalBytes = await this.encryptToBytes(text, password);
		const base64Text = btoa(this.convertArrayToString(finalBytes));
		return base64Text;
	}

	private async decryptFromBytes(encryptedBytes: Uint8Array, password: string): Promise<string|null> {
		try {
			let offset: number;
			let nextOffset: number|undefined;

			// extract iv
			offset = 0;
			nextOffset = offset + this.vectorSize;
			const vector = encryptedBytes.slice(offset, nextOffset);
			// extract salt
			offset = nextOffset;
			nextOffset = offset + this.saltSize;
			const salt = encryptedBytes.slice(offset, nextOffset);
			// extract encrypted text
			offset = nextOffset;
			nextOffset = undefined;
			const encryptedTextBytes = encryptedBytes.slice(offset);

			const key = await this.deriveKey(password, salt);

			const decryptedBytes = await crypto.subtle.decrypt(
				{
					name: 'AES-GCM',
					iv: vector
				},
				key,
				encryptedTextBytes
			);
			const utf8Decoder	= new TextDecoder();
			const decryptedText = utf8Decoder.decode(decryptedBytes);
			return decryptedText;
		} catch (e) {
			return null;
		}
	}

	public async decryptFromBase64(base64Encoded: string, password: string): Promise<string|null> {
		try {
			const bytesToDecode = this.convertStringToArray(atob(base64Encoded));
			return await this.decryptFromBytes(bytesToDecode, password);
		} catch (e) {
			return null;
		}
	}

}
