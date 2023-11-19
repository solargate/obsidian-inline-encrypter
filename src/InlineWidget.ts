import { App } from "obsidian";
import { EditorView, WidgetType } from "@codemirror/view";

import { UiHelper } from 'UiHelper';

export class InlineWidget extends WidgetType {

    constructor(public app: App, public value: string) {
        super();
    }

    toDOM(view: EditorView): HTMLElement {
        const uiHelper = new UiHelper();
        const div = document.createElement('div');
        div.addClass('inline-encrypter-lp-code');
        const a = div.createEl('a');
        a.addClass('inline-encrypter-code');
        a.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, event, this.value));        
        return div;
    }

}
