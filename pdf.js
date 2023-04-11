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


module.exports = function(RED) {

    function HTML(config) {
        var configAsJson = JSON.stringify(config);
        var html = String.raw`

`;
        return html;
    }

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_pdf.error.no-group"));
            return false;
        }
        return true;
    }

    var ui = undefined;

    function PDFNode(config) {
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
        RED.nodes.registerType("ui_pdf", PDFNode);
    })
}
