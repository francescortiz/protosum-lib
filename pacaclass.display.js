//PacaClass.include('jquery-1.7.2.min.js');
//PacaClass.include('pure_min.js');
//PacaClass.include('pacaclass.event.js');


/*********************************************
 *
 * DisplayEvent(template_selector, [directives])
 * Events associated with display
 *
 */
/**
 *
 * @class
 * @extends {Event}
 */
window.DisplayEvent = PacaClass('DisplayEvent', Event); (function(){ var public = DisplayEvent.prototype;

    DisplayEvent.TEMPLATE_RENDERED = "TEMPLATE_RENDERED";
    DisplayEvent.ADDED_TO_CONTAINER = "ADDED_TO_CONTAINER";

    /** @lends DisplayEvent */

    /**
     * @constructor
     * @param eventName {String}
     * @param eventTarget {Object}
     */
    public.constructor = function(eventName, eventTarget) {
        this.getSuper(Event).constructor.call(this, eventName);
        this.target = eventTarget;
    }

})();


/***************************
 *  PageEvent
 *      El único evento que necesita el game controller (classe Citroen):
 *
 */
window.PageEvent = PacaClass('PageEvent', Event); (function(){ var public = PageEvent.prototype;

    PageEvent.PAGE_EVENT = "PAGE_EVENT";

    public.constructor = function(pageName, effect, data) {
        this.getSuper(Event).constructor.call(this, PageEvent.PAGE_EVENT);
        this.pageName = pageName;
        this.effect = effect;
        this.data = data;
    }

})();


/*********************************************
 *
 * @DisplayObject(template_selector, [directives])
 * Basically, it is just an alternate signature for EventDispatcher used to certificate calls to DisplayObjectContainer's addChild
 *
 * events:
 *      DisplayEvent.ADDED_TO_CONTAINER
 *          triggered when the display object gets added to a DisplayObjectContainer
 *
 */
window.DisplayObject = PacaClass('DisplayObject', EventDispatcher); (function () { var public = DisplayObject.prototype;

    public.node;

    public.constructor = function(){
        this.getSuper(EventDispatcher).constructor.call(this);
    }

})();

/*********************************************
 *
 * @DisplayObjectContainer(template_selector, [directives])
 * A class that has contentNode attribute set to a jquery object that allows us to add childs to it.
 *
 * methods:
 *      addChild(child): add given child to this.contentNode
 *      clear(): removes all childs
 *      TODO: addChildAt? getChildIndex? prependChild? numChildren? etc
 *
 * USAGE:
 *      you have to fill [Template instance].data before the template gets added to a DisplayObjectContainer.
 *
 */
window.DisplayObjectContainer = PacaClass('DisplayObjectContainer'); (function() { var public = DisplayObjectContainer.prototype;

    public.children = [];

    public.constructor = function(){
        // Empty constructor
    }

    public.addChild = function(child, effect) {

        if (!child.isInstance(DisplayObject)) {
            throw new Error("DisplayObjectContainer.appendChild: child must be a DisplayObject instance.");
        }
        if (!this.contentNode) {
            throw new Error("DisplayObjectContainer.appendChild: this.contentNode must be set to a jquery object.");
        }
        var node;
        if (child.isInstance(Template)) {
            node = child.render();
        } else {
            node = child.node;
        }


        if (effect == "right") {
            node.css('left', '-64em');
        } else if (effect == "fade") {
            node.css('opacity', 0);
        } else {
            // TODO: Así el efecto queda más chulo, pero habría que poder definir independiente el efecto de entrada y el de salida
            node.css('opacity', 0);
            //node.css('left', '64em');
        }
        this.contentNode.append(node);
        setTimeout(function(){
            node.css({
                'left':'0',
                'opacity':'1'
            });
        },0);

        this.children.push(child);

        child.dispatchEvent(new DisplayEvent(DisplayEvent.ADDED_TO_CONTAINER, child));

    };

    public.clear = function(effect) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].destroy();
        }
        this.contentNode.children().each(function(){

            var jthis = $(this);

            // Hacemos que no se note si hemos scrolado
            var scrollTop = $(window).scrollTop();
            if (scrollTop) {
                jthis.css('top', Citroen.instance.toEms(-scrollTop) + "em");
                $(window).scrollTop(0);
            }

            if (effect == "right") {
                jthis.css({
                    'left':'64em'
                });
            } else {
                jthis.css({
                    'left':'-64em'
                });
            }


            setTimeout(
                delegate(function(){
                    $(this).remove();
                }, this),
                550
            );

        });
        this.children = [];
        //this.contentNode.empty();
    };

})();




/*********************************************
 *
 * @DomObject(selector, [content_selector])
 * Representation of an element of the dom
 *
 * arguments:
 *      selector: selector for the dom element to associate to
 *      content_selector: optional. target for addChild calls. allows us to handle complex structures in a simpler way.
 *
 */
window.DomObject = PacaClass('DomObject', DisplayObject, DisplayObjectContainer); (function() { var public = DomObject.prototype;

    public.constructor = function(selector, content_selector) {

        this.getSuper(DisplayObject).constructor.call(this);

        if (!selector) {
            throw new Error("DomElement.constructor: a jquery selector must be given")
        }
        this.node = $(selector);

        if (content_selector) {
            this.contentNode = $(content_selector);
        } else {
            this.contentNode = this.node;
        }

    }

})();


///*********************************************
// *
// * @class Template
// * @inherits DisplayObject, DisplayObjectContainer
// * (template_selector, [directives])
// * Wrapper for pure templates.
// *
// * arguments:
// *      template_selector: uses the selector target as a template
// *      content_selector: optional. directives to feed the pure template
// *
// * events:
// *      DisplayEvent.TEMPLATE_RENDERED
// *          This is a good moment associate jquery events to the content.
// *          [DisplayEvent instance].target points to the jquery node to be added
// *
// * USAGE:
// *      you have to fill [Template instance].data before the template gets added to a DisplayObjectContainer.
// *
// */
//window.Template = PacaClass('Template', DisplayObject, DisplayObjectContainer); (function() { var public = Template.prototype;
//
//    // Set this if you want to feed the pure template
//    public.data = null;
//    public.renderedNode;
//
//    public.constructor = function (template_selector, directives) {
//
//        this.getSuper(DisplayObject).constructor.call(this);
//        this.directives = directives;
//
//        var templateNode;
//        try {
//            templateNode = $(template_selector).clone(true, true);
//        } catch (e) {
//            throw new Error("No se encuentra el selector '" + template_selector + "'");
//        }
//        if (templateNode.length == 0) {
//            throw new Error("Template.constructor: template_selector did not match any dom element -> " + template_selector);
//        }
//        templateNode.remove();
//        this.templateNode = templateNode;
//
//        if (arguments.length > 2) {
//            this.contentNode = $(arguments[2]);
//        } else {
//            this.contentNode = this.node;
//        }
//
//    }
//
//    public.render = function() {
//        //var copy = $(this.template_html);
//        var rendered = this.templateNode.clone(true, true);
//        rendered = rendered.directives(this.directives).render(this.data);
//        rendered.data('templateInstance', this);
//        this.renderedNode = rendered;
//        this.dispatchEvent(new DisplayEvent(DisplayEvent.TEMPLATE_RENDERED, rendered));
//        return rendered;
//    }
//
//})();

///**
// * @class Page
// * @inherits Template
// * Template subclass that accepts the data attribute in the constructor.
// */
//window.Page = PacaClass('Page', Template); (function(){ var public = Page.prototype;
//
//    /**
//     * @constructor Page
//     * Creates a new Page
//     * @parent Page}
//     * @param {String} template_selector    see template
//     * @param {Object} directives           see template
//     * @param {Object} data
//     */
//    public.constructor = function(template_selector, directives, data) {
//        this.getSuper(Template).constructor.call(this, template_selector, directives);
//        this.data = data;
//    }
//
//})();
//
//
///***************************
// *
// * @ScalableLayout(target_width)
// *  Layout to help with scalable sites (for mobiles) working with ems.
// *
// *  arguments:
// *      target_width (in pixels)
// *          - makes 1em = 100px
// *
// */
//window.ScalableLayout = PacaClass(); ('ScalableLayout', function() { var public = ScalableLayout.prototype;
//
//    // Private static
//    var _target_width;
//    public.scaleRatio;
//
//    public.resize = function () {
//        this.scaleRatio = $('body').width() / _target_width;
//        $('body').css('font-size', this.scaleRatio + 'px');
//    };
//
//    public.toEms = function (value) {
//        return value / this.scaleRatio / 10;
//    }
//    public.toPixels = function (value) {
//        return value * this.scaleRatio * 10;
//    }
//
//    public.constructor = function(target_width) {
//        if (document.readyState !== 'loaded' && document.readyState !== 'complete' && document.readyState !== 'interactive') {
//            throw new Error("ScalableLayout.constructor: document is not ready. Defer ScalableLayout instantiation");
//        }
//        if (!target_width) {
//            throw new Error("ScalableLayout.constructor: must specify a target width");
//        }
//        _target_width = target_width;
//        $(window).resize(delegate(this.resize, this));
//        this.resize();
//        this.resize(); // A second resize call is needed the first time...
//    }
//
//})();
//
//
//window.Pages = PacaClass(); (function(){ var public = Pages.constructor;
//
//    /**
//     * Page list
//     * @static
//     * @type {Object}
//     */
//    Pages.pages = {}
//
//
//    public.constructor = function() {
//
//        throw new Error("Pages class only has static methods");
//
//    }
//
//    /**
//     * @static
//     * @type void
//     * @param name {String} page name
//     * @param _class {Page} page class
//     * @param data {Object} page parameters
//     * @type {String}
//     */
//    Pages.add = function(name, _class, parameters) {
//
//        if (Pages.pages[name]) {
//            throw new Error("Page '" + name + "' already declared.");
//        }
//
//        parameters["name"] = name;
//        parameters["class"] = _class;
//        Pages.pages[name] = parameters;
//
//        return name;
//
//    }
//
//    /**
//     * get a page by name
//     * @param name {String} page regisitered with Pages.add
//     * @param [additionalData] {Object} Data to pass/override to/from the registered page
//     * @return {Object}
//     */
//    Pages.get = function(name, additionalData) {
//        var resp = Pages.pages[name];
//        if (!resp) {
//            throw new Error("Page '" + name + "' not declared.");
//        }
//        resp = Utils.oSum(resp, additionalData);
//        return resp;
//    }
//
//})();
//
//
window.DeviceSetup = PacaClass('DeviceSetup'); (function(){ var public = DeviceSetup.prototype;

    DeviceSetup.dragStartEvent;
    DeviceSetup.moveEvent;
    DeviceSetup.dragEndEvent;

    /**
     * Initializes device setup
     * @param [isMobile] {Boolean}
     */
    DeviceSetup.initialize = function(isMobile) {
        if (isMobile) {
            DeviceSetup.dragStartEvent = "touchstart";
            DeviceSetup.moveEvent = "touchmove";
            DeviceSetup.dragEndEvent = "touchend";
        } else {
            DeviceSetup.dragStartEvent = "mousedown";
            DeviceSetup.moveEvent = "mousemove";
            DeviceSetup.dragEndEvent = "mouseup";
        }
    }

})();
//
//
///*********************************************
// *
// * @DisplayObject(template_selector, [directives])
// * Basically, it is just an alternate signature for EventDispatcher used to certificate calls to DisplayObjectContainer's addChild
// *
// * events:
// *      DisplayEvent.ADDED_TO_CONTAINER
// *          triggered when the display object gets added to a DisplayObjectContainer
// *
// */
//window.NativeDisplayObject = PacaClass('NativeDisplayObject', EventDispatcher);
//(function () {
//    var public = NativeDisplayObject.prototype;
//
//    public.node;
//
//    public.constructor = function (node) {
//        this.getSuper(EventDispatcher).constructor.call(this);
//    }
//
//})();
//
//
//window.NativeDisplayObjectContainer = PacaClass('NativeDisplayObjectContainer');
//(function () {
//    var public = NativeDisplayObjectContainer.prototype;
//
//    public.children = [];
//
//    public.constructor = function () {
//        // Empty constructor
//    }
//
//    public.addChild = function (child) {
//
//        if (!child.isInstance(NativeDisplayObject)) {
//            throw new Error("NativeDisplayObjectContainer.appendChild: child must be a NativeDisplayObject instance.");
//        }
//        if (!this.contentNode) {
//            throw new Error("NativeDisplayObjectContainer.appendChild: this.contentNode must be set to a dom object.");
//        }
//
//        this.contentNode.appendChild(child.node);
//        this.children.push(child);
//
//        child.dispatchEvent(new DisplayEvent(DisplayEvent.ADDED_TO_CONTAINER, child));
//    };
//
//    public.clear = function (effect) {
//        for (var i = 0; i < this.children.length; i++) {
//            var child = this.children[i];
//            this.contentNode.removeChild(child.node)
//            child.destroy();
//        }
//        this.children = [];
//    };
//
//})();
//
//window.NativeDomObject = PacaClass('NativeDomObject', NativeDisplayObject, NativeDisplayObjectContainer);
//(function () {
//    var public = NativeDomObject.prototype;
//
//    public.constructor = function (node, content_node) {
//
//        this.getSuper(NativeDisplayObject).constructor.call(this);
//
//        if (!node) {
//            throw new Error("NativeDomObject.constructor: a dom object must be given")
//        }
//        this.node = node;
//
//        if (content_node) {
//            this.contentNode = content_node;
//        } else {
//            this.contentNode = this.node;
//        }
//
//    }
//
//})();