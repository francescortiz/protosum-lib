/**
 * PacaClass base event Event
 * @class
 */
window.PCEvent = PacaClass('PCEvent');  (function() {var public = PCEvent.prototype;

    /** @lends PCEvent */

    /**
     * if set to true, no more events will be executed after this one.
     * @type Boolean
     */
    public.default_prevented = false;

    /**
     * Creates an event
     * @param name  String  name of the event to create.
     * @constructor
     */
    public.constructor = function(name) {
        this.name = name;
    }

    /**
     * If called, no more events are executed after this event
     */
    public.preventDefault = function() {
        this.default_prevented = true;
    }

    /**
     * Checks where we prevented default
     * @return Boolean
     */
    public.isDefaultPrevented = function() {
        return this.default_prevented;
    }

})();


/**
 * EventDispatcher
 * @class
 */
window.PCEventDispatcher = PacaClass('PCEventDispatcher');  (function() {var public = PCEventDispatcher.prototype;

    /**
     * Contains the list of all registered events in the application.
     * @type {Object}
     */
    public.registered_events = {};

    /**
     * @constructs PCEventDispatcher
     */
    public.constructor = function() {

    }

    /**
     * Adds an event listener
     * @param name            String    name of the event
     * @param handler         Function  function to execute when the event is triggered
     * @param scope           Object    object to set the scope of the event to
     * @param [low_priority]  Boolean   if true, the event will be pushed to the end of the event queue
     */
    public.addEventListener = function(name, handler, scope, low_priority) {
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
    public.dispatchEvent = function(event) {
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
    public.removeEventListener = function(name, handler, scope) {
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
    public.clearEventListeners = function(scope, handler) {
        if (!scope && !handler) {
            this.registered_events = {};
        } else {
            for (var event_name in this.registered_events) {
                var handler_list = this.registered_events[event_name];
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
                this.registered_events[event_name] = nhd;
            }
        }
    }

})();