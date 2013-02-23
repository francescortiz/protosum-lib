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

/**
 * PacaClass base event Event
 * @type PCEvent
 */
window.PCEvent = PacaClass('PCEvent');  (function() {
    /**
     * PCEvent prototype
     * @type Object
     */
    var proto = PCEvent.prototype;

    /**
     * if set to true, no more events will be executed after this one.
     * @type Boolean
     */
    proto.default_prevented = false;
    /**
     * Name of the event
     * @type String
     */
    proto.name;
    /**
     * Holds the dispatching object. Set automatically by the eventdisepatcher.
     * @type PCEventDispatcher
     */
    proto.dispatcher;

    /**
     * It contains the number of times the event has been used when your event handler receives it.
     * @type {Number}
     */
    proto.use_count = 0;

    /**
     * Creates an event
     * @param name  String  name of the event to create.
     * @constructor
     */
    proto.constructor = function(name) {
        this.name = name;
    }

    /**
     * If called, no more events are executed after this event
     */
    proto.preventDefault = function() {
        this.default_prevented = true;
    }

    /**
     * in PCEvent it is equivalent to prevent default, but events that extends PCEvent might do more things.
     */
    proto.cancel = function() {
        this.default_prevented = true;
    }

    /**
     * Checks where we prevented default
     * @return Boolean
     */
    proto.isPropagationStopped = function() {
        return this.default_prevented;
    }

})();


/**
 * EventDispatcher
 * @type PCEventDispatcher
 */
window.PCEventDispatcher = PacaClass('PCEventDispatcher');  (function() {
    var proto = PCEventDispatcher.prototype;

    /**
     * Contains the list of all registered events in the application.
     * @type {Object}
     */
    proto.registered_events;

    /**
     * @constructs PCEventDispatcher
     */
    proto.constructor = function() {
        this.registered_events = {};
    }

    /**
     * Adds an event listener
     * @param name            String    name of the event
     * @param handler         Function  function to execute when the event is triggered
     * @param scope           Object    object to set the scope of the event to
     * @param [low_priority]  Boolean   if true, the event will be pushed to the end of the event queue
     */
    proto.addEventListener = function(name, handler, scope, low_priority) {
        if (!handler) {
            throw new Error("PCEventDispatcher.addEventListener: Undefined handler provided for " + name + " on " + scope.__class__.__name__);
        }
        if (!scope) {
            throw new Error("PCEventDispatcher.addEventListener: Undefined scope provided for " + name + ".");
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
        event.dispatcher = this;
        var handler_list = this.registered_events[event.name];
        if (handler_list) {
            var len = handler_list.length;
            for (var i = 0; i < len; i++) {
                var handler_data = handler_list[i];
                var func = handler_data[0];
                var scope = handler_data[1];
                func.call(scope, event);
                event.use_count += 1;
                if (event.default_prevented) {
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
     */
    proto.removeEventListener = function(name, handler, scope) {
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

    };

    /**
     * Removes all event listeners.
     * @param [scope]    Object    if specified, remove only events associated with this scope
     * @param [handler]  Function  if specified, remove only events associated with this handler function
     */
    proto.clearEventListeners = function(scope, handler) {
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
            }
        }
    }

})();

