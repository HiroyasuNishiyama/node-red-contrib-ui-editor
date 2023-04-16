/* eslint-disable indent */
/**
 * Copyright 2023 HiroyasuNishiyama
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


module.exports = (RED) => {
    const path = require("path");
    const fs = require("fs");

    const editor_config = [
        {
            name: null,
            path: "node_modules/@editorjs/editorjs/dist/editor.js",
            conf: "",
        },
        {
            name: "checklist",
            path: "node_modules/@editorjs/checklist/dist/bundle.js",
            conf: String.raw`
checklist: {
    class: Checklist,
    inlineToolbar: true,
},
`,
        },
        {
            name: "code",
            path: "node_modules/@editorjs/code/dist/bundle.js",
            conf: String.raw`
code: {
    class: CodeTool,
    placeholder: 'Enter a code' ,
},
`,
        },
        {
            name: "delimiter",
            path: "node_modules/@editorjs/delimiter/dist/bundle.js",
            conf: String.raw`
delimiter: Delimiter,
`,
        },
        {
            name: "embed",
            path: "node_modules/@editorjs/embed/dist/bundle.js",
            conf: String.raw`
embed: Embed,
`,
        },
        {
            name: "header",
            path: "node_modules/@editorjs/header/dist/bundle.js",
            conf: String.raw`
header: {
    class: Header,
    inlineToolbar: true,
    placeholder: 'Enter a header',
},
`,
        },
        {
            name: "inlineCode",
            path: "node_modules/@editorjs/inline-code/dist/bundle.js",
            conf: String.raw`
inlineCode: {
    class: InlineCode,
},
`,
        },
        {
            name: "marker",
            path: "node_modules/@editorjs/marker/dist/bundle.js",
            conf: String.raw`
marker: {
    class: Marker,
},
`,
        },
        {
            name: "list",
            path: "node_modules/@editorjs/nested-list/dist/nested-list.js",
            conf: String.raw`
list: {
    class: NestedList,
    inlineToolbar: true,
    config: {
        defaultStyle: 'unordered'
    }
},
`,
        },
        {
            name: "quote",
            path: "node_modules/@editorjs/quote/dist/bundle.js",
            conf: String.raw`
quote: {
    class: Quote,
    inlineToolbar: true,
    quotePlaceholder: 'Enter a quote',
    captionPlaceholder: 'Quote\'s author',
},
`,
        },
        {
            name: "raw",
            path: "node_modules/@editorjs/raw/dist/bundle.js",
            conf: String.raw`
raw: {
    class: RawTool,
    placeholder: 'Enter a raw HTML code' ,
},
`
        },
        {
            name: "image",
            path: "node_modules/@editorjs/simple-image/dist/bundle.js",
            conf: String.raw`
image: SimpleImage,
`,
        },
        {
            name: "table",
            path: "node_modules/@editorjs/table/dist/table.js",
            conf: String.raw`
table: {
    class: Table,
    inlineToolbar: true,
    config: {
        rows: 2,
        cols: 3,
    }
},
`,
                
        },
        {
            name: "textVariant",
            path: "node_modules/@editorjs/text-variant-tune/dist/text-variant-tune.js",
            tune: "textVariant",
            conf: String.raw`
            textVariant: {
                class: TextVariantTune,
            },
`,
        },
        {
            name: "underline",
            path: "node_modules/@editorjs/underline/dist/bundle.js",
            conf: String.raw`
underline: {
    class: Underline,
},
`,
        },
        {
            name: "warning",
            path: "node_modules/@editorjs/warning/dist/bundle.js",
            conf: String.raw`
warning: {
class: Warning,
    config: {
        titlePlaceholder: 'Title',
        messagePlaceholder: 'Message',
    },
},
`,
        },
    ];

    function HTML(config) {
        let html = "";
        const libs = editor_config.map((def) => def.path);
        libs.forEach((lib) => {
            const lib_path = path.join(__dirname, lib);
            html += "<script>\n";
            html += fs.readFileSync(lib_path);
            html += "</script>\n";
        });
        const tool_conf = editor_config.map((x) => x.conf).join("\n");
        const tunes = editor_config.filter((x) => x.hasOwnProperty("tune")).map((x) => "'"+x.tune+"'").join(", ");
        html += String.raw`
<div>
    <div id="editorjs"/>
</div>
<script>
((scope) => {
let editor = null;

function loadScripts(list, callback) {
    if (list.length > 0) {
        var done = false;
        var src = list.shift();
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = src;
        head.appendChild(script);
        script.onload = script.onreadystatechange = () => {
            if (!done) {
                if (!this.readyState ||
                    (this.readyState === "loaded") ||
                    (this.readyState === "complete")) {
                    done = true;
                    loadScripts(list, callback);
                    if (head && script.parentNode) {
                        head.removeChild(script);
                    }
                }
            }
        };
    }
    else {
        callback();
    }
}

function init(scope) {
    let readonly = false;
    editor = new EditorJS({
        holderId: 'editorjs',
        readOnly: readonly,
        tools: {
${tool_conf}
        },
        tunes: [${tunes}],
        onReady: () => {
        }
    });

    scope.$watch("msg", (msg) => {
        editor.isReady.then(() => {
            const command = msg.command;
            const payload = msg.payload;
            if (command) {
                if (command === "save") {
                    editor.save().then((data) => {
                        scope.send({payload: data});
                    }).catch((error) => {
                        console.log('Editor save data failed:', error);
                    });
                }
                else if (command === "readOnly.toggle") {
                    readonly = !readonly;
                    editor.readOnly.toggle();
                    scope.send({payload: readonly});
                }
                else if (command === "clear") {
                    editor.blocks.clear();
                    scope.send({payload: true});
                }
                else if (command === "render") {
                    editor.blocks.render(payload);
                    scope.send({payload: true});
                }
                else if (command === "delete") {
                    editor.blocks.delete(payload);
                    scope.send({payload: true});
                }
                else if (command === "move") {
                    if (payload &&
                        payload.hasOwnProperty("toIndex") &&
                        payload.hasOwnProperty("fromIndex")) {
                        const toIndex = payload.toIndex;
                        const fromIndex = payload.fromIndex;
                        editor.blocks.delete(toIndex, fromIndex);
                        scope.send({payload: true});
                    }
                    else {
                        scope.send({payload: false});
                    }
                }
                else if (command === "getById") {
                    editor.save().then((data) => {
                        let result = null;
                        if (data && data.blocks) {
                            const blocks = data.blocks;
                            result = blocks.find((e) => (e.id === payload));
                        }
                        if (result) {
                            scope.send({payload: result});
                        }
                        else {
                            scope.send({payload: false});
                        }
                    }).catch((error) => {
                        scope.send({payload: false});
                    });
                }
                else if (command === "getBlockByIndex") {
                    editor.save().then((data) => {
                        let result = null;
                        if (data && data.blocks) {
                            const blocks = data.blocks;
                            try {
                                result = blocks[payload];
                            }
                            catch (e) {
                                // ignore illegal access
                                console.log("; error: ", e);
                            }
                        }
                        if (result) {
                            scope.send({payload: result});
                        }
                        else {
                            scope.send({payload: false});
                        }
                    }).catch((error) => {
                        scope.send({payload: false});
                    });
                }
                else if (command === "getCurrentBlockIndex") {
                    const index = editor.blocks.getCurrentBlockIndex();
                    scope.send({payload: index});
                }
                else if (command === "getBlocksCount") {
                    const count = editor.blocks.getBlocksCount();
                    scope.send({payload: count});
                }
                else if (command === "stretchBlock") {
                    if (payload &&
                        payload.hasOwnProperty("index") &&
                        payload.hasOwnProperty("status")) {
                        editor.blocks.stretchBlock(payload.index, payload.status);
                        scope.send({payload: true});
                    }
                    else {
                        scope.send({payload: false});
                    }
                }
                else if (command === "insert") {
                    if (payload &&
                        payload.hasOwnProperty("type") &&
                        payload.hasOwnProperty("data") &&
                        payload.hasOwnProperty("config") &&
                        payload.hasOwnProperty("index") &&
                        payload.hasOwnProperty("needsToSetFocus")) {
                        editor.blocks.insert(payload.type,
                                             payload.data, 
                                             payload.config, 
                                             payload.index, 
                                             payload.needToSetFocus);
                        scope.send({payload: true});
                    }
                    else {
                        scope.send({payload: false});
                    }
                }
                else if (command === "update") {
                    if (payload &&
                        payload.hasOwnProperty("id") &&
                        payload.hasOwnProperty("data")) {
                        editor.blocks.update(payload.id,
                                             payload.data);
                        scope.send({payload: true});
                    }
                    else {
                        scope.send({payload: false});
                    }
                }
                else if (command === "composeBlockData") {
                    editor.blocks.composeBlockData(payload).then((data) => {
                        scope.send({payload: data});
                    });
                }
            }
        }).catch((error) => {
            console.log('Editor initialization failed:', error);
        });
    });
}

loadScripts([
], () => {
    init(scope);
});
})(scope)
</script>
`;
        return html;
    }

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_editor.error.no-group"));
            return false;
        }
        return true;
    }

    var ui = undefined;

    function EditorNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);

            if (checkConfig(node, config)) {
                var html = HTML(config);
                var done = ui.addWidget({
                    node: node,
                    order: config.order,
                    group: config.group,
                    width: config.width,
                    height: config.height,
                    format: html,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,

                    convertBack: function (value) {
                        return value;
                    },

                    beforeEmit: function(msg, value) {
                        return { msg: msg };
                    },

                    beforeSend: function (msg, orig) {
                        if (orig) {
                            return orig.msg;
                        }
                    },

                    initController: function($scope, events) {
                    }
                });
            }
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.warn(e);		// catch any errors that may occur and display them in the web browsers console
        }

        node.on("close", function() {
            if (done) {
                done();
            }
        });
    }

    setImmediate(function() {
        RED.nodes.registerType("ui_editor", EditorNode);
    })
}
