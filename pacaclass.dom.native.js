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


//PacaClass.include("pacaclass.dom");




/**
 * A class that represents a DOM object that can be added to another DOM object. The container must be a NativeDisplayObjectContainer
 * @type NativeDisplayObject
 */
window.NativeDisplayObject = PacaClass('NativeDisplayObject', PCEventDispatcher); (function () {
    var proto = NativeDisplayObject.prototype;

    /**
     * @type {HTMLElement}
     */
    proto.node;

    proto.constructor = function(node){
        if (!node) {
            throw new Error("NativeDisplayObject.constructor: a dom object must be given as node argument")
        }
        this.getSuper(PCEventDispatcher).constructor.call(this);
        this.node = node;
    }

    proto.getNode = function() {
        return this.node;
    }

})();


/**
 * A class that represents DOM object that can contain DOM objects. These DOM objects must be mapped into DisplayObjects
 * @type NativeDisplayObjectContainer
 */
window.NativeDisplayObjectContainer = PacaClass('NativeDisplayObjectContainer'); (function() {
    var proto = NativeDisplayObjectContainer.prototype;

    /**
     * @type {NativeDisplayObject[]}
     */
    proto.children;
    /**
     * @type {HTMLElement}
     */
    proto.node;
    /**
     * @type {HTMLElement}
     */
    proto.contentNode;

    proto.constructor = function(node, contentNode){
        this.children = [];
        if (!node) {
            throw new Error("NativeDisplayObjectContainer.constructor: a dom object must be given as node argument")
        }
        this.node = node;
        if (contentNode) {
            this.contentNode = contentNode;
        } else {
            this.contentNode = node;
        }
    }

    proto.addChild = function(child, effect) {

        if (!child.isInstance(NativeDisplayObject)) {
            throw new Error("NativeDisplayObjectContainer.appendChild: child must be a NativeDisplayObject instance.");
        }
        var node = child.getNode();

        this.contentNode.appendChild(node);
        this.children.push(child);

        child.dispatchEvent(new DisplayEvent(DisplayEvent.ADDED_TO_CONTAINER, this));

    };

    proto.clear = function() {
        var contentNode = this.contentNode;
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.destroy();
            contentNode.removeChild(child.node);
        }
        this.children = [];
    };

})();

/**
 * A class that represents a DOM object that can be added into another DOM object and that can contain DOM objects (NativeDisplayObject + NativeDisplayObjectContainer).
 * @type NativeDomObject
 */
window.NativeDomObject = PacaClass('NativeDomObject', NativeDisplayObject, NativeDisplayObjectContainer); (function () {
    var proto = NativeDomObject.prototype;

    proto.constructor = function (node, content_node) {
        this.getSuper(NativeDisplayObject).constructor.call(this, node);
        this.getSuper(NativeDisplayObjectContainer).constructor.call(this, node, content_node);
    }

})();


window.NativePCEvent = PacaClass('NativePCEvent', PCEvent); (function(){
    var proto = NativePCEvent.prototype;

    /**
     *
     * @type {Event}
     */
    proto.native_event;

    /**
     *
     * @param native_event {Event}
     */
    proto.constructor = function(native_event) {
        this.getSuper(PCEvent).constructor.call(this, native_event.type);
        this.native_event = native_event;
    }

})();

/**
 * @extends NativeDisplayObject
 * @extends NativePCEventDispatcher
 * @type NativePCEventDispatcher
 */
window.NativePCEventDispatcher = PacaClass('NativePCEventDispatcher', NativeDisplayObject, PCEventDispatcher); (function(){
    var proto = NativePCEventDispatcher.prototype;

    var NATIVE_EVENTS = [
        "click","dblclick","mousedown","mousemove","mouseover","mouseup","keydown","keypress","keyup","abort","error",
        "load","resize","scroll","unload","blur","change","focus","reset","select","submit"
    ];
    var NATIVE_EVENTS_LENGTH = NATIVE_EVENTS.length;

    /**
     *
     * @param node {HTMLElement}
     */
    proto.constructor = function(node) {
        this.getSuper(NativeDisplayObject).constructor.call(this, node);
        this.__native_listener__ = delegate(this.native_listener, this);
    }

    /**
     *
     * @param native_event Event
     */
    proto.native_listener = function(native_event) {
        if (!native_event) {
            native_event = window.event;
        }
        var ne = new NativePCEvent(native_event)
        this.dispatchEvent(ne);
        if (ne.propagation_stopped) {
            native_event.stopPropagation();
            native_event.cancelBubble = true;
        }
    }

    NativePCEventDispatcher.isNative = function(name) {
        var i = 0;
        for (;i < NATIVE_EVENTS_LENGTH; i++) {
            if (NATIVE_EVENTS[i] === name) {
                return true;
            }
        }
        return false;
        return false;
    }

    /**
     * Adds an event listener
     * @param name            String    name of the event
     * @param handler         Function  function to execute when the event is triggered
     * @param scope           Object    object to set the scope of the event to
     * @param [low_priority]  Boolean   if true, the event will be pushed to the end of the event queue
     * @param [use_capture]   Boolean   if true and the event is a native event, the event will registered using useCapture. Does nothing on IE8 and lower.
     */
    proto.addEventListener = function(name, handler, scope, low_priority, use_capture) {
        if (!handler) {
            throw new Error("PCEventDispatcher.addEventListener: Undefined handler provided for " + name + " on " + scope.__class__.__name__);
        }
        if (!scope) {
            throw new Error("PCEventDispatcher.addEventListener: Undefined scope provided for " + name + ".");
        }
        if (NativePCEventDispatcher.isNative(name)) {
            // TODO: Should we check if the event is already registered?
            // TODO: Should we make a setter for NativeDisplayObject called setNode that we can override to detect the function to use instead of doing it realtime?
            var node = this.node;
            if (node.addEventListener) { // W3C DOM
                node.addEventListener(name, this.__native_listener__, use_capture);
            } else if (node.attachEvent) { // IE <= 8
                node.attachEvent("on"+name, this.__native_listener__);
            }
        }
        var handler_list = this.registered_events[name];
        if (!handler_list) {
            handler_list = [];
        }
        if (low_priority) {
            handler_list.push([handler, scope]);
        } else {
            handler_list.unshift([handler, scope]);
        }
        this.registered_events[name] = handler_list;

        // Be friendly with garbage collector TODO: UNTESTED!!!
        if (!scope.__event_dispatchers__) {
            scope.__event_dispatchers__ = [];
        }
        var len = scope.__event_dispatchers__.length;
        var found = false;
        for (var i = 0; i < len; i++) {
            if (scope.__event_dispatchers__[i] == this) {
                found = true;
            }
        }
        if (!scope.__original_destroy__) {
            scope.__event_dispatchers__.push(this);
            scope.__original_destroy__ = scope.destroy;
            scope.destroy = function() {
                this.__original_destroy__.apply(this, arguments);
                var len = this.__event_dispatchers__.length;
                for (var i = 0; i < len; i++) {
                    this.__event_dispatchers__[i].clearEventListeners(this);
                }
            }
        }
    };

    /**
     * Triggers an event
     * @param event  PCEvent  event to dispatch
     */
    proto.dispatchEvent = function(event) {
        if (!event || !event.isInstance || !event.isInstance(PCEvent)) {
            throw new Error("PCEventDispatcher.trigger: event is not PCEvent instance. PCEvent = " + event);
        }
        var handler_list = this.registered_events[event.name];
        if (handler_list) {
            var len = handler_list.length;
            for (var i = 0; i < len; i++) {
                var handler_data = handler_list[i];
                var func = handler_data[0];
                var scope = handler_data[1];
                func.call(scope, event);
                if (event.propagation_stopped) {
                    return;
                }
            }
        }
    };

    /**
     * Removes and event listener
     * @param name       String    name of the event
     * @param [handler]  Function  function associated to the event. If omited al handlers are removed
     * @param [scope]    Object    object to remove event from. If omited all objects are removed.
     * @param [use_capture] Boolean If we set use_capture to true when we registered the event, we must set it to true when unregistering the event.
     */
    proto.removeEventListener = function(name, handler, scope, use_capture) {
        if (!handler && !scope) {
            this.registered_events[name] = {};
        }

        var handler_list = this.registered_events[name];
        if (handler_list) {
            var len = handler_list.length;
            var nhd = [];
            for (var i = 0; i < len; i++) {
                var handler_data = handler_list[i];
                var func = handler_data[0];
                var scope = handler_data[1];
                if (!handler) {
                    // Si no pasamos handler queremos vaciar todas las referencias del evento para este objeto.
                    if (scope == scope) {
                        continue;
                    }
                } else {
                    if (!scope || scope == scope) {
                        // Si no pasamos scope, borramos todas las referencias de handler, sinó, solo las del scope especificado.
                        continue;
                    }
                }
                nhd.push(handler_data);
            }
            this.registered_events[name] = nhd;

        }

        if (!nhd.length && NativePCEventDispatcher.isNative(name)) {
            // TODO: Should we check if the event is already registered?
            // TODO: Should we make a setter for NativeDisplayObject called setNode that we can override to detect the function to use instead of doing it realtime?
            var node = this.node;
            if (node.removeEventListener) { // W3C DOM
//                TODO: Right now use_capture events are not distinguished from the ones that don't use use_capture by NativeEventListener. We should extend the addEventListener function so that it doesn't mix them.
                node.removeEventListener(name, this.__native_listener__, use_capture);
            } else if (node.detachEvent) { // IE <= 8
                node.detachEvent("on"+name, this.__native_listener__);
            }
        }

    };

    /**
     * Removes all event listeners.
     * @param [scope]    Object    if specified, remove only events associated with this scope
     * @param [handler]  Function  if specified, remove only events associated with this handler function
     * @param [use_capture] Boolean  Whether we want to clear native events created with useCapture
     */
    proto.clearEventListeners = function(scope, handler, use_capture) {
        if (!scope && !handler) {
            this.registered_events = {};
        } else {
            for (var name in this.registered_events) {
                var handler_list = this.registered_events[name];
                var len = handler_list.length;
                var nhd = [];
                for (var i = 0; i < len; i++) {
                    var handler_data = handler_list[i];
                    var _handler = handler_data[0];
                    var _scope = handler_data[1];
                    if (_scope == scope && !handler) {
                        continue;
                    } else if (!scope && _handler == handler) {
                        continue;
                    } else if (_scope == scope && _handler == handler) {
                        continue;
                    }
                    nhd.push(handler_data);
                }
                this.registered_events[name] = nhd;

                if (!nhd.length && NativePCEventDispatcher.isNative(name)) {
                    // TODO: Should we check if the event is already registered?
                    // TODO: Should we make a setter for NativeDisplayObject called setNode that we can override to detect the function to use instead of doing it realtime?
                    var node = this.node;
                    if (node.removeEventListener) { // W3C DOM
//                      TODO: Right now use_capture events are not distinguished from the ones that don't use use_capture by NativeEventListener. We should extend the addEventListener function so that it doesn't mix them.
                        node.removeEventListener(name, this.__native_listener__, use_capture);
                    } else if (node.detachEvent) { // IE <= 8
                        node.detachEvent("on"+name, this.__native_listener__);
                    }
                }
            }
        }
    }

})();