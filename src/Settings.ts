import { App, PluginSettingTab, Setting } from 'obsidian';

import InlineEncrypterPlugin from 'main';
import { saveStatePasswordGlobal, saveStatePasswordRemember } from 'Globals';

export interface InlineEncrypterPluginSettings {
    autoCopy: boolean;
	rememberPassword: boolean;
}

export const DEFAULT_SETTINGS: InlineEncrypterPluginSettings = {
    autoCopy: false,
	rememberPassword: false,
}

export class InlineEncrypterSettingTab extends PluginSettingTab {
	plugin: InlineEncrypterPlugin;
    icon = "lock";

	constructor(app: App, plugin: InlineEncrypterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Auto copy secret to clipboard')
			.setDesc('Copy secret to clipboard automatically')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoCopy)
                .onChange(async (value) => {
                    this.plugin.settings.autoCopy = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

		new Setting(containerEl)
			.setName('Remember password until session restarts')
			.setDesc('Remember correct password until Obsidian session restarts')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rememberPassword)
                .onChange(async (value) => {
                    this.plugin.settings.rememberPassword = value;
                    if (value === false) {
                        saveStatePasswordGlobal('');
                    }
                    saveStatePasswordRemember(value);
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

	}
}
