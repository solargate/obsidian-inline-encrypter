# Obsidian Inline Encrypter Plugin

## Overview

Encrypt your secrets in the [Obsidian.md](https://obsidian.md/) notes.

This is a simple plugin for encrypting the text in Obsidian notes just inline. It was inspired by [Obsidian Encrypt Plugin](https://github.com/meld-cp/obsidian-encrypt).

> ⚠️ WARNING: Use at your own risk. Your passwords are never stored anywher. If you forget your passwords you can't decrypt your notes. Do not give access to your files to a third party to avoid possible decryption of data.

You can encrypt all the text in a note, as well as parts of it, such as the contents of lists, tables, etc. The encrypted value is saved directly in the note as a block of code and appears as a button in reading mode.

Edit mode:

![Editing mode](docs/images/screen_01_edit.png)

Reading mode:

![Reading mode](docs/images/screen_02_read.png)

## Usage

### Encryption

1. In edit mode select text you want to encrypt.

2. Run **Encrypt selected text** from command palette.

![Commands](docs/images/screen_03_command.png)

3. Enter the password for encryption.

### Decryption

1. To see the decrypted value without decrypting it in the text of the note, simply click on the button in reading mode.

![Button](docs/images/screen_04_button.png)

2. Enter the password for decryption.

3. To decrypt a secret in the text of a note, select the entire code block in edit mode.

![Selecting secret](docs/images/screen_05_secret_select.png)

4. Run **Decrypt selected text** from command palette.

5. Enter the password for decryption.

## Technical Notes

Encryption algorhytm is `aes-256-gcm`. Salt and IV are unique and random.
