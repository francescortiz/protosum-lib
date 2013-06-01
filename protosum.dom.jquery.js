/***************
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 ****************/

//ProtoSum.include("protosum.dom");

/**
 * A class that represents a DOM object that can be added to another DOM object. The container must be a DisplayObject
 * @type DisplayObject
 */
window.DisplayObject = ProtoSum('DisplayObject', PCEventDispatcher); (function () {
    var proto = DisplayObject.prototype;

    proto.node;

    proto.__init__ = function(node){
        if (!node) {
            throw new Error("DisplayObject.__init__: a dom object must be given as node argument")
        }
        this.getSuper(PCEventDispatcher).__init__.call(this);
        this.node = $(node);
    }

    // We encapsulate the node getter just in case we want to interefer with the node before it is added to the dom
    proto.getNode = function() {
        return this.node;
    }

})();


/**
 * A class that represents DOM object that can contain DOM objects. These DOM objects must be mapped into DisplayObjects
 * @type DisplayObjectContainer
 */
window.DisplayObjectContainer = ProtoSum('DisplayObjectContainer'); (function() {
    var proto = DisplayObjectContainer.prototype;

    proto.children;
    proto.node;
    proto.contentNode;

    proto.__init__ = function(node, contentNode){
        if (!node) {
            throw new Error("DisplayObjectContainer.__init__: a dom object must be given as node argument")
        }
        this.children = [];
        this.node = $(node);
        if (contentNode) {
            this.contentNode = $(contentNode);
        } else {
            this.contentNode = this.node;
        }
    }

    proto.addChild = function(child, effect) {

        if (!child.isInstance(DisplayObject)) {
            throw new Error("DisplayObjectContainer.appendChild: child must be a DisplayObject instance.");
        }
        var node = child.getNode();

        this.contentNode.append(node);
        this.children.push(child);

        child.dispatchEvent(new DisplayEvent(DisplayEvent.ADDED_TO_CONTAINER, child));

    };

    /**
     * Removes all DisplayObjects that we added.
     */
    proto.clear = function() {
        var contentNode = this.contentNode;
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.destroy();
            contentNode.remove(child.node);
        }
        this.children = [];
    };

})();

/**
 * A class that represents a DOM object that can be added into another DOM object and that can contain DOM objects (DisplayObject + DisplayObjectContainer).
 * @type DomObject
 */
window.DomObject = ProtoSum('DomObject', DisplayObject, DisplayObjectContainer); (function () {
    var proto = DomObject.prototype;

    proto.__init__ = function (node, content_node) {
        if (!node) {
            throw new Error("DomObject.__init__: a dom object must be given as node argument")
        }
        this.getSuper(PCEventDispatcher).__init__.call(this);
        this.node = $(node);
        if (contentNode) {
            this.contentNode = $(contentNode);
        } else {
            this.contentNode = this.node;
        }
    }

})();

