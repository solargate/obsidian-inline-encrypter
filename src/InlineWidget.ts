import { App } from "obsidian";
import { EditorView, WidgetType } from "@codemirror/view";

//import { UiHelper } from 'UiHelper';

export class InlineWidget extends WidgetType {

    constructor(public app: App, public value: string) {
        super();
    }

    toDOM(view: EditorView): HTMLElement {
        //const uiHelper = new UiHelper();
        const el = document.createElement('a');
        el.className = 'inline-encrypter-code';
        //el.onClickEvent((event: MouseEvent) => uiHelper.handleDecryptClick(this.app, event, this.value));
        return el;
    }

}
