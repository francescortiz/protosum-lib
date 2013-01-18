/***************

ABOUT:
  Framework to work with class inheritance. It is pythonish, so remember:
  - You have multiple inheritance
  - Always use this ot access methods or atributes
  - Everything is public... well, we are on javascript, do your tricks if you need to.

LIMITATIONS:
  - Forget about private. But since the implementation
    is pythonish, and python doesn't have the concept of private,
    it is fine.
  - Always provide a constructor, unless you are sure that no
    superclass has a constructor, to prevent unwanted repeated constructor
    calls.

USAGE:
  - PacaClass([className], [main superclass], [superclass], [superclass], ...);
      * Returns a subclass of the given classes
      * it popuplates [class].prototype.__class__ with a reference to the created class
      * if first argument is a string, it is used to populate [class].prototype.__class__.name
      * it popuplates [class].supers with an array af all superclassses. TODO: prevent repetitions in [class].supers array
  - PacaClass.include("path/to/javascript/file.js");
      * Behaves like import
  
  Then, for the instances you have:
  - [instance].isInstance([class]);
      * like instanceof, but with support for multiple inheritance
  - [instance].getSuper([superclass])
      * returns the specified super prototype.

EXAMPLE:
    var C = PacaClass(A, B); (function() {var public = C.prototype;

        public.someVar = "somveValue";
        public.c = "99";
        
        public.constructor = function(){
            this.getSuper(A).constructor.call(this);
            log("C constructor");
        }
        public.doC = function() {
            log(this.c);
        }
        public.whoAmI = function() {
            log("i am C and my supers says: ");
            this.getSuper(A).whoAmI.call(this); // calls whoAmI in A
            this.getSuper(B).whoAmI();  // calls whoAmI in B
        }
        
        public.customeEvent = function(event) {
            log("C.customEvent", "event.data = ", event.data, "this.someVar = ",this.someVar);
        }

    })();

CONSIDERATIONS:
  - super and import are reserved words, so getSuper and include have been chosen instead.
  - public methods and attributes are declared outside the constructor in order to have
    access to them before instantiating the classes for the first time TODO: Check if this is actually true.
  - the proposed class declaration structure looks for being comfortable coming from
    other OOP languages.

****************/

var log = function(){
    var stderr = document.getElementById('stderr');
    if (stderr) {
        var m = "";
        for (var i = 0; i < arguments.length; i++) {
            m += arguments[i] + ", ";
        }
        stderr.innerHTML += m + "<br/>";
    } else {
        try {
            console.log(arguments);
        } catch (e) {
            var m = "";
            for (var i = 0; i < arguments.length; i++) {
                m += arguments[i] + ", ";
            }
            alert(m);
        }
    }
};

/**
 * TODO: Determinar si se hace que las classe base de PacaClass incorpore el metodo 'this.delegate = function(method) {return delegate(method, this)}' para que su uso sea más simple...
 * TODO: ...o ver si si se hace que el constructor predeterminado haga automáticamente en todos los métodos 'this.method = delegate(this.method, this)' para olvidarse de los delegates.
 * @param method {Function}
 * @param instance {Object}
 * @param [args] {Array}
 * @return {Function}
 */
var delegate = function (method, instance, args ) {
    return function() {
        if (args) {
            return method.apply(instance, args);
        } else {
            return method.apply(instance, arguments);
        }
    }
}

var getClassName = function (classReference) {
    // search through the global object for a name that resolves to this object
    for (var name in this)
        if (this[name] == classReference)
            return name
}


/**
 *
 * @return {Function}
 * @constructor
 */
var PacaClass = function() {

    var args = arguments;

    var sub = function(){
        this.constructor && this.constructor.apply(this,arguments);
    };
    sub.supers = [];
    sub.prototype.__class__ = sub;
    sub.prototype.destroy = function() {
        // empty destructor
    }
    sub.prototype.getSuper = function(requestedSuper){

        var len = this.__class__.supers.length;
        for (var i = 0; i < len; i++) {
            var _super = this.__class__.supers[i];
            if (_super == requestedSuper) {
                return _super.prototype;
            }
        }

        throw new Error("getSuper: " + getClassName(requestedSuper) + " is not a superclass of " + getClassName(this.__class__))

    }

    sub.prototype.isInstance = function(requestedSuper) {
        if (this instanceof requestedSuper) {
            return true;
        }
        var len = this.__class__.supers.length;
        for (var i = 0; i < len; i++) {
            var _super = this.__class__.supers[i];
            if (_super == requestedSuper) {
                return true;
            }
            if (_super.prototype.isInstance && _super.prototype.isInstance(requestedSuper)) {
                return true;
            }
        }
        return false;
    }
    if (typeof args[0] == "string") {
        sub.__name__ = args[0];
        var na = []
        for (var i = 1; i < args.length; i++) {
            na.push(args[i]);
        }
        args = na;
    }

    if (!args.length) {
        return sub;
    }
    
    var copyProto = function(sub, _super) {
        var thinF = function(){};
        thinF.prototype = _super.prototype;
        var newProto = new thinF();
        for (var i in sub.prototype) {
            newProto[i] = sub.prototype[i];
        }
        sub.prototype = newProto;
    }
    
    //var supers = [];
    var single = function(sub, _super) {
        copyProto(sub, _super);

        if( _super.prototype.constructor == Object.prototype.constructor ){
            _super.prototype.constructor = _super;
        }
        
    }
    
    var multi = function(sub,_super){
        
        var proto = _super.prototype;
        for (var f in proto) {
            if (sub.prototype[f] === undefined) {
                if (proto[f] == "function") {
                    sub.prototype[f] = function() {
                        return proto[f].apply(this,arguments);
                    }
                } else {
                    sub.prototype[f] = proto[f];
                }
            }
        }
    }

    single(sub, args[0]);
    sub.supers.push(args[0]);
    if (args[0].supers.length) {
        sub.supers = sub.supers.concat(args[0].supers);
    }
    for( var i = 1; i < args.length; i++){
        multi(sub, args[i]);
        sub.supers.push(args[i]);
        if (args[i].supers.length) {
            sub.supers = sub.supers.concat(args[i].supers);
        }
    }


    
    return sub;
    
};

PacaClass.settings = {
    JS_PATH:''
};

PacaClass.include = function(src) {

    function GetHttpRequest() {
        if ( window.XMLHttpRequest ) // Gecko
            return new XMLHttpRequest() ;
        else if ( window.ActiveXObject ) // IE
            return new ActiveXObject("MsXml2.XmlHttp") ;
    }
    function IncludeJS(sId, fileUrl, source) {
        if (source != null && !document.getElementById(sId)) {
            var oHead = document.getElementsByTagName('HEAD').item(0);
            var oScript = document.createElement("script");
            oScript.language = "javascript";
            oScript.type = "text/javascript";
            oScript.id = sId;
            oScript.defer = true;
            oScript.text = source;
            oHead.appendChild(oScript);
        }
    }
    function AjaxPage(sId, url) {
        var oXmlHttp = GetHttpRequest();
        oXmlHttp.OnReadyStateChange = function() {
            if (oXmlHttp.readyState == 4) {
                if (oXmlHttp.status == 200 || oXmlHttp.status == 304) {
                    //IncludeJS( sId, url, oXmlHttp.responseText );
                } else {
                    log( 'XML request error: ' + oXmlHttp.statusText + ' (' + oXmlHttp.status + ')' ) ;
                }
            }
        }
        oXmlHttp.open('GET', url, false);
        oXmlHttp.send(null);
        IncludeJS( sId, url, oXmlHttp.responseText );
    }
    if (src.indexOf("http") != -1) {
        AjaxPage(src, src);
    } else {
        AjaxPage(src, PacaClass.settings.JS_PATH + src);
    }
}

var pcl = {};