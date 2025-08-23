import { App } from "obsidian";
import { EditorView, WidgetType } from "@codemirror/view";

import InlineEncrypterPlugin from 'main';
import { UiHelper } from 'UiHelper';

export class InlineWidget extends WidgetType {
    plugin: InlineEncrypterPlugin;

    constructor(public app: App, plugin: InlineEncrypterPlugin, public value: string) {
        super();
        this.plugin = plugin;
    }

    toDOM(view: EditorView): HTMLElement {
        const uiHelper = new UiHelper();
        const div = document.createElement('div');
        div.addClass('inline-encrypter-lp-code');
        const a = div.createEl('a');
        a.addClass('inline-encrypter-code');
        a.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, this.plugin, event, this.value));        
        return div;
    }

}
