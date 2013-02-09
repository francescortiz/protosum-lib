/***************

ABOUT:
  AS3 like event handling.

LIMITATIONS:
  - On purpose, one event can have only one name associated.
  - There is no priority (yet). New event bindings get execute last.

USAGE:
  - new PCEventDispatcher(); // Creates and event dispatcher instance
  - var CustomEvent = PacaClass('CustomEvent', PCEvent); // Extends class PCEvent to create a custom event.

 PCEventDispatcher methods:
    - bind(eventClass, handlerFunction, scope, [lowPriority:boolean])
        * by default new event listeners get called first in order to have event.preventDefault() useful.
    - unbind(eventClass, [handlerFunction], [scope])
        * you can pass undefined or omit handlerFunction, scope or both
        * it removes all events that match the given parameters.
    - trigger(eventInstance)

 PCEvent methos:
    - preventDefault()
        * stops event queue execution after this handlerFunction finishes.

  Define events like you would do in acstionscript. See example.


EXAMPLE:
    var CustomEvent = PacaClass('CustomEvent', PCEvent); (function() {var public = CustomEvent.prototype;

        public.name = "customevent";

        public.constructor = function(data) {
            this.data = data;
        }

    })();

    var C = PacaClass(A, B); (function() {var public = C.prototype;

        public.someVar = "somveValue";

        public.customeEventHandler = function(event) {
            log("C.customEvent", "event.data = ", event.data, "this.someVar = ",this.someVar);
        }

    })();

    var ed = new PCEventDispatcher();

    ed.bind(CustomEvent, c.customeEventHandler, c);
    ed.trigger(new CustomEvent("custom event data")); // C.customeEventHandler gets called

    ed.unbind(CustomEvent, c.customeEventHandler, c);
    ed.trigger(new CustomEvent("custom event data")); // Nothing happens


CONSIDERATIONS:

****************/

/**
 *
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
 *
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