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
/*
        {
            name: "paragraph",
            path: "node_modules/@editorjs/paragraph/dist/bundle.js",
            conf: String.raw`
paragraph: {
     class: Paragraph,
     inlineToolbar: true,
     placeholder: 'Enter a paragraph',
},
`,
        },
*/
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
            console.log("; lib:", lib_path);
            html += "<script>\n";
            html += fs.readFileSync(lib_path);
            html += "</script>\n";
        });
        const tool_conf = editor_config.map((x) => x.conf).join("\n");
        const tunes = editor_config.filter((x) => x.hasOwnProperty("tune")).map((x) => "'"+x.tune+"'").join(", ");
        console.log("; conf:", tool_conf);
        console.log("; tune:", tunes);
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
        console.log("; loading => ", src);
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = src;
        head.appendChild(script);
        script.onload = script.onreadystatechange = () => {
            if (!done) {
                if (!this.readyState ||
                    (this.readyState === "loaded") ||
                    (this.readyState === "complete")) {
                    console.log("; load: OK");
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

function init() {
    console.log("; init editor");
    editor = new EditorJS({
        holderId: 'editorjs',
        readOnly: false,
        tools: {
${tool_conf}
        },
        tunes: [${tunes}],
        onReady: () => {
        }
    });
}

loadScripts([
], () => {
    init();
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
                        //debugger;

                        $scope.flag = true;   // not sure if this is needed?

                        $scope.init = function (config) {
                            $scope.config = config;

                            $scope.textContent = config.textLabel;
                        };

                        $scope.$watch('msg', function(msg) {
                            if (!msg) { return; }

                            $scope.textContent = msg.payload;
                        });

                        $scope.change = function() {
                            $scope.send({payload: $scope.textContent});
                        };

                        $scope.enterkey = function(keyEvent){
                            if (keyEvent.which === 13) {
                                $scope.send({payload: $scope.textContent});
                            }
                        };

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
