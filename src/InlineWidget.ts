import { App } from "obsidian";
import { EditorView, WidgetType } from "@codemirror/view";

import InlineEncrypterPlugin from 'main';
import { UiHelper } from 'UiHelper';
import { MouseButton } from 'Constants';

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

        a.addEventListener('click', (event: MouseEvent) => {
            if (event.button !== MouseButton.Left) return;
            uiHelper.handleDecryptClick(this.app, this.plugin, event, this.value);
        });

        a.addEventListener('mouseup', (event: MouseEvent) => {
            if (event.button !== MouseButton.Right) return;
            event.preventDefault();
            event.stopPropagation();
            const pos = { x: event.clientX, y: event.clientY };
            setTimeout(() => uiHelper.openContextMenuAt(this.app, this.plugin, pos, this.value), 0);
        });

        a.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });

        return div;
    }

}
