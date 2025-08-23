import { App, PluginSettingTab, Setting } from 'obsidian';

import InlineEncrypterPlugin from 'main';

export interface InlineEncrypterPluginSettings {
    autoCopy: boolean;
}

export const DEFAULT_SETTINGS: InlineEncrypterPluginSettings = {
    autoCopy: false,
}

export class InlineEncrypterSettingTab extends PluginSettingTab {
	plugin: InlineEncrypterPlugin;

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
	}
}
