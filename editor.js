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

    function HTML(config) {
        var configAsJson = JSON.stringify(config);
        var html = String.raw`
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
        tools: {
            embed: Embed,
            header: {
                class: Header,
                inlineToolbar: true,
                placeholder: 'Enter a header',
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                placeholder: 'Enter a paragraph',
            },
            delimiter: Delimiter,
            list: {
                class: NestedList,
                inlineToolbar: true,
                config: {
                    defaultStyle: 'unordered'
                }
            },
            checklist: {
                class: Checklist,
                inlineToolbar: true,
            },
            code: {
                class: CodeTool,
                placeholder: 'Enter a code' ,
            },
            raw: {
                class: RawTool,
                placeholder: 'Enter a raw HTML code' ,
            },
            table: {
                class: Table,
                inlineToolbar: true,
                config: {
                    rows: 2,
                    cols: 3,
                }
            },
            image: SimpleImage,
            quote: {
                class: Quote,
                inlineToolbar: true,
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: 'Quote\'s author',
            },
            inlineCode: {
                class: InlineCode,
            },
            underline: {
                class: Underline,
            },
            marker: {
                class: Marker,
            },
            warning: {
                class: Warning,
                config: {
                    titlePlaceholder: 'Title',
                    messagePlaceholder: 'Message',
                },
            },
            textVariant: {
                class: TextVariantTune,
            },
        },
        tunes: [
            'textVariant',
        ],
        onReady: () => {
        }
    });
}

loadScripts([
    "https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest",

    "https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/code@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/delimiter",
    "https://cdn.jsdelivr.net/npm/@editorjs/embed@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/header@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/marker@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/nested-list@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/paragraph",
    "https://cdn.jsdelivr.net/npm/@editorjs/quote@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/raw@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/simple-image@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/table@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/text-variant-tune@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/underline@latest",
    "https://cdn.jsdelivr.net/npm/@editorjs/warning@latest",
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
