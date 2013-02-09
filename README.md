pacaclass-lib
=============

Basic libraries that take advantage of pacaclass.

pacaclass.event
____________________
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