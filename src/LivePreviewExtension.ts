import { App, editorLivePreviewField } from "obsidian";
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import type { PluginValue } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

import { InlineWidget } from 'InlineWidget';
import { UiHelper } from "UiHelper";
import { ENCRYPTED_CODE_PREFIX } from 'Constants';

export const livePreviewExtension = (app: App) => ViewPlugin.fromClass(class implements PluginValue {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        if (!update.state.field(editorLivePreviewField)) {
            this.decorations = Decoration.none;
            return;
        }
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    destroy(): void {}

    private buildDecorations(view: EditorView): DecorationSet {
        if (!view.state.field(editorLivePreviewField)) return Decoration.none;

        const uiHelper = new UiHelper();
        const builder = new RangeSetBuilder<Decoration>();
        const selection = view.state.selection;
    
        for (const { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node) {
                    if (node.type.name.startsWith("inline-code")) {
                        const value = view.state.doc.sliceString(node.from, node.to)
                        const isEncrypted = value.indexOf(ENCRYPTED_CODE_PREFIX) === 0;

                        if (isEncrypted) {
                            if (!uiHelper.selectionAndRangeOverlap(selection, node.from-1, node.to+1)) {
                                builder.add(
                                    node.from,
                                    node.to,
                                    Decoration.replace({
                                        widget: new InlineWidget(app, value)
                                    })
                                );
                            }
                            //else {
                            //    builder.add(
                            //        node.from,
                            //        node.from,
                            //        Decoration.replace({
                            //            widget: new InlineWidget(app, value),
                            //            inclusive: false
                            //        }),
                            //    );
                            //}
                        }
                    }
                },
            });
        }
        return builder.finish();
    }
},
{
    decorations: instance => instance.decorations,
}
);

//const pluginSpec: PluginSpec<LivePreviewExtension> = {
//    decorations: (value: LivePreviewExtension) => value.decorations,
//};

//export const livePreviewExtension = (app: App) => ViewPlugin.fromClass(LivePreviewExtension, pluginSpec);
