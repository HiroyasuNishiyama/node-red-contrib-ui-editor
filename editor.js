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
            name: "editor",
            path: "@editorjs/editorjs/dist/editor.js",
            conf: "",
        },
        {
            name: "checklist",
            path: "@editorjs/checklist/dist/bundle.js",
            conf: String.raw`
checklist: {
    class: Checklist,
    inlineToolbar: true,
},
`,
        },
        {
            name: "code",
            path: "@editorjs/code/dist/bundle.js",
            conf: String.raw`
code: {
    class: CodeTool,
    placeholder: 'Enter a code' ,
},
`,
        },
        {
            name: "delimiter",
            path: "@editorjs/delimiter/dist/bundle.js",
            conf: String.raw`
delimiter: Delimiter,
`,
        },
        {
            name: "embed",
            path: "@editorjs/embed/dist/bundle.js",
            conf: String.raw`
embed: Embed,
`,
        },
        {
            name: "header",
            path: "@editorjs/header/dist/bundle.js",
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
            path: "@editorjs/inline-code/dist/bundle.js",
            conf: String.raw`
inlineCode: {
    class: InlineCode,
},
`,
        },
        {
            name: "marker",
            path: "@editorjs/marker/dist/bundle.js",
            conf: String.raw`
marker: {
    class: Marker,
},
`,
        },
        {
            name: "list",
            path: "@editorjs/nested-list/dist/nested-list.js",
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
            path: "@editorjs/quote/dist/bundle.js",
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
            path: "@editorjs/raw/dist/bundle.js",
            conf: String.raw`
raw: {
    class: RawTool,
    placeholder: 'Enter a raw HTML code' ,
},
`
        },
        {
            name: "image",
            path: "@editorjs/simple-image/dist/bundle.js",
            conf: String.raw`
image: SimpleImage,
`,
        },
        {
            name: "table",
            path: "@editorjs/table/dist/table.js",
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
            path: "@editorjs/text-variant-tune/dist/text-variant-tune.js",
            tune: "textVariant",
            conf: String.raw`
            textVariant: {
                class: TextVariantTune,
            },
`,
        },
        {
            name: "underline",
            path: "@editorjs/underline/dist/bundle.js",
            conf: String.raw`
underline: {
    class: Underline,
},
`,
        },
        {
            name: "warning",
            path: "@editorjs/warning/dist/bundle.js",
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
        const id = "editorjs-"+config.id;
        const monitor_update = !!config.monitorUpdate;
        const readonly = !!config.readonly;
        let html = "";
        const libURIs = editor_config.map((x) => "'"+"ui_editor/libs/"+x.name+"'").join(", ");
        const tool_conf = editor_config.map((x) => x.conf).join("\n");
        const tunes = editor_config.filter((x) => x.hasOwnProperty("tune")).map((x) => "'"+x.tune+"'").join(", ");
        html += String.raw`
<div>
    <div id="${id}"/>
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
    let readonly = ${readonly};
    const data = {};
    editor = new EditorJS({
        holder: '${id}',
        readOnly: readonly,
        tools: {
${tool_conf}
        },
        tunes: [${tunes}],
        data: data,
        onChange: (api, event) => {
            if (${monitor_update}) {
                scope.send([null, {payload: event}]);
            }
        }
    });

    scope.$watch("msg", (msg) => {
        function send(result) {
            msg.payload = result; 
            scope.send(msg);
        }
        if (!msg) {
            return;
        }
        editor.isReady.then(() => {
            const command = msg.topic;
            const payload = msg.payload;
            if (command) {
                if (command === "save") {
                    editor.save().then((data) => {
                        send(data);
                    }).catch((error) => {
                        console.log('Editor save data failed:', error);
                    });
                }
                else if (command === "readOnly.toggle") {
                    readonly = !readonly;
                    editor.readOnly.toggle();
                    send(readonly);
                }
                else if (command === "clear") {
                    editor.blocks.clear();
                    send(true);
                }
                else if (command === "render") {
                    editor.blocks.render(payload);
                    send(true);
                }
                else if (command === "delete") {
                    editor.blocks.delete(payload);
                    send(true);
                }
                else if (command === "move") {
                    if (payload &&
                        payload.hasOwnProperty("toIndex") &&
                        payload.hasOwnProperty("fromIndex")) {
                        const toIndex = payload.toIndex;
                        const fromIndex = payload.fromIndex;
                        editor.blocks.delete(toIndex, fromIndex);
                        send(true);
                    }
                    else {
                        send(false);
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
                            send(result);
                        }
                        else {
                            send(false);
                        }
                    }).catch((error) => {
                        send(false);
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
                            send(result);
                        }
                        else {
                            send(false);
                        }
                    }).catch((error) => {
                        send(false);
                    });
                }
                else if (command === "getCurrentBlockIndex") {
                    const index = editor.blocks.getCurrentBlockIndex();
                    send(index);
                }
                else if (command === "getBlocksCount") {
                    const count = editor.blocks.getBlocksCount();
                    send(count);
                }
                else if (command === "stretchBlock") {
                    if (payload &&
                        payload.hasOwnProperty("index") &&
                        payload.hasOwnProperty("status")) {
                        editor.blocks.stretchBlock(payload.index, payload.status);
                        send(true);
                    }
                    else {
                        send(false);
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
                        send(true);
                    }
                    else {
                        send(false);
                    }
                }
                else if (command === "update") {
                    if (payload &&
                        payload.hasOwnProperty("id") &&
                        payload.hasOwnProperty("data")) {
                        editor.blocks.update(payload.id,
                                             payload.data);
                        send(true);
                    }
                    else {
                        send(false);
                    }
                }
                else if (command === "composeBlockData") {
                    editor.blocks.composeBlockData(payload).then((data) => {
                        send(data);
                    });
                }
            }
        }).catch((error) => {
            console.log('Editor initialization failed:', error);
        });
    });
}

loadScripts([${libURIs}], () => {
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
            console.warn(e);
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

    RED.httpAdmin.get("/ui/ui_editor/libs/:name", (req, res) => {
        const conf = editor_config.find((x) => (x.name === req.params.name));
        if (conf) {
            const lib_path = require.resolve(conf.path);
            if (fs.existsSync(lib_path)) {
                res.sendFile(lib_path);
                return;
            }
            else {
                console.log("; failed to load: ", lib_path);
            }
        }
        res.writeHead(404);
        return res.end("Unknown library name");
    });
}
