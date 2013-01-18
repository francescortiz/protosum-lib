/***************

ABOUT:
  AS3 like event handling.

LIMITATIONS:
  - On purpose, one event can have only one name associated.
  - There is no priority (yet). New event bindings get execute last.

USAGE:
  - new EventDispatcher(); // Creates and event dispatcher instance
  - var CustomEvent = PacaClass(Event); // Extends class Event to create a custom event.

  EventDispatcher methods:
    - bind(eventClass, handlerFunction, scope, [lowPriority:boolean])
        * by default new event listeners get called first in order to have event.preventDefault() useful.
    - unbind(eventClass, [handlerFunction], [scope])
        * you can pass undefined or omit handlerFunction, scope or both
        * it removes all events that match the given parameters.
    - trigger(eventInstance)

  Event methos:
    - preventDefault()
        * stops event queue execution after this handlerFunction finishes.

  Define events like you would do in acstionscript. See example.


EXAMPLE:
    var CustomEvent = PacaClass(Event); (function() {var public = CustomEvent.prototype;

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

    var ed = new EventDispatcher();

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
window.Event = PacaClass('Event');  (function() {var public = Event.prototype;

    /** @lends Event */

    /**
     * @constructor
     * @param eventName
     */
    public.constructor = function(eventName) {
        this.name = eventName;
    }

    /**
     *
     */
    public.preventDefault = function() {
        this.defaultPrevented = true;
    }

    /**
     *
     * @return {Boolean}
     */
    public.isDefaultPrevented = function() {
        return this.defaultPrevented;
    }

})();


/**
 *
 * @class
 */
window.EventDispatcher = PacaClass('EventDispatcher');  (function() {var public = EventDispatcher.prototype;

    public.registeredEvents = {};

    /**
     * @constructs EventDispatcher
     */
    public.constructor = function() {

    }

    /**
     *
     * @param eventName {String}
     * @param handler {Function}
     * @param handlerScope {Object}
     */
    public.addEventListener = function(eventName, handler, handlerScope) {
        if (!handler) {
            throw new Error("EventDispatcher.addEventListener: Undefined handler provided for " + eventName + " on " + handlerScope.__class__.__name__);
        }
        if (!handlerScope) {
            throw new Error("EventDispatcher.addEventListener: Undefined handlerScope provided for " + eventName + ".");
        }
        var lowPriority = arguments[3];
        var handlerList = this.registeredEvents[eventName];
        if (!handlerList) {
            handlerList = [];
        }
        if (lowPriority) {
            handlerList.push([handler, handlerScope]);
        } else {
            handlerList.unshift([handler, handlerScope]);
        }
        this.registeredEvents[eventName] = handlerList;

        // Be friendly with garbage collector TODO: UNTESTED!!!
        if (!handlerScope.__event_dispatchers__) {
            handlerScope.__event_dispatchers__ = [];
        }
        var len = handlerScope.__event_dispatchers__.length;
        var found = false;
        for (var i = 0; i < len; i++) {
            if (handlerScope.__event_dispatchers__[i] == this) {
                found = true;
            }
        }
        if (!handlerScope.__original_destroy__) {
            handlerScope.__event_dispatchers__.push(this);
            handlerScope.__original_destroy__ = handlerScope.destroy;
            handlerScope.destroy = function() {
                this.__original_destroy__.apply(this, arguments);
                var len = this.__event_dispatchers__.length;
                for (var i = 0; i < len; i++) {
                    this.__event_dispatchers__[i].clearEventListeners(this);
                }
            }
        }
    };

    /***************************
    trigger(event)
    ****************************/
    public.dispatchEvent = function(event) {
        if (!event.isInstance(Event)) {
            throw new Error("EventDispatcher.trigger: event is not Event instance. Event = " + event);
        }
        var handlerList = this.registeredEvents[event.name];
        if (handlerList) {
            var len = handlerList.length;
            for (var i = 0; i < len; i++) {
                var handlerData = handlerList[i];
                var func = handlerData[0];
                var scope = handlerData[1];
                func.call(scope, event);
                if (event.defaultPrevented) {
                    return;
                }
            }
        }
    };

    /***************************
    unbind(event, [handler], [scope])
    ****************************/
    public.removeEventListener = function(eventName) {
        var eventName = eventName;
        var handler = arguments[1];
        var handlerScope = arguments[2];

        if (!handler && !handlerScope) {
            this.registeredEvents[eventName] = {};
        }

        var handlerList = this.registeredEvents[eventName];
        if (handlerList) {
            var len = handlerList.length;
            var nhd = [];
            for (var i = 0; i < len; i++) {
                var handlerData = handlerList[i];
                var func = handlerData[0];
                var scope = handlerData[1];
                if (!handler) {
                    // Si no pasamos handler queremos vaciar todas las referencias del evento para este objeto.
                    if (handlerScope == scope) {
                        continue;
                    }
                } else {
                    if (!handlerScope || handlerScope == scope) {
                        // Si no pasamos scope, borramos todas las referencias de handler, sinó, solo las del scope especificado.
                        continue;
                    }
                }
                nhd.push(handlerData);
            }
            this.registeredEvents[eventName] = nhd;

        }

    };

    /**
     *
     * @param [handlerScope] if specified, remove only events associated with this target.
     */
    public.clearEventListeners = function(handlerScope) {
        // TODO: UNTESTED!!!!
        if (!handlerScope) {
            this.registeredEvents = {};
        } else {
            for (var eventName in this.registeredEvents) {
                var handlerList = this.registeredEvents[eventName];
                var len = handlerList.length;
                var nhd = [];
                for (var i = 0; i < len; i++) {
                    var handlerData = handlerList[i];
                    var func = handlerData[0];
                    var scope = handlerData[1];
                    if (handlerScope == scope) {
                        continue;
                    }
                    nhd.push(handlerData);
                }
                this.registeredEvents[eventName] = nhd;
            }
        }
    }

})();