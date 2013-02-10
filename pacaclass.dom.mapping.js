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
 * Utilities to map classes to dom objects
 * @type {*}
 */
window.DomMapping = PacaClass('DomMapping'); (function(){
    var proto = DomMapping.prototype;

    /**
     *
     * @param domobject HTMLElement
     * @param class_name String
     * @return {DisplayObject}
     * @private
     */
    DomMapping.__map = function(domobject, class_name, args) {
        if (!domobject.pacaclass_instance) {
            var instance;
            var eval_code = "instance = new " + class_name + "(domobject";
            for (var j = 0; j < args.length; j++) {
                eval_code += ", args[" + j + "]";
            }
            eval_code += ");";
            eval(eval_code);
            domobject.pacaclass_instance = instance;
        }
        return instance;
    }


    /**
     * Mapped dom objects get a pacaclass_instance attribute that points to the PacaClass class. Extra arguments are passed to the constructor.
     * The class must accept the dom object as first argument.
     * @param selector
     * @param class_name
     * @return {Array}  List of class instances created.
     */
    DomMapping.map = function(selector, class_name) {
        var matches = $(selector);
        var matches_length = matches.length;
        var list = [];
        var args = [].splice.call(arguments,0, 2);
        for (var i = 0; i < matches_length; i++) {
            var domobject = matches[i];
            var instance = DomMapping.__map(domobject, class_name, args);
            if (instance) {
                list.push(instance);
            }
        }
        return list;
    }

    /**
     * Remove mappings. Calls the destroy function of each mapping before removing the mapping.
     * @param selector      Object  jQuery selector
     * @param [class_name]  String
     * @return {Array}      List of dom objects that have been unmapped
     */
    DomMapping.unmap = function(selector, class_name) {
        var matches = $(selector);
        var matches_length = matches.length;
        var list = [];
        for (var i = 0; i < matches_length; i++) {
            var domobject = matches[i];
            var instance = domobject.pacaclass_instance;
            if (instance) {
                if (class_name && instance.__class__.__name__ != class_name) {
                    continue;
                }
                instance.destroy();
                delete domobject.pacaclass_instance;
            }
            list.push(domobject);
        }
        return list;
    }

    /**
     * Maps dom objects that have a pacaclass attribute set.
     * @param [selector]  Object  jQuery selector to search inside. If omited uses the whole HTML.
     */
    DomMapping.automap = function(selector) {
        var matches;
        if (selector) {
            matches = $(selector).find('[pacaclass]');
        } else {
            matches = $('[pacaclass]');
        }
        var matches_length = matches.length;
        var list = [];
        var args = [].splice.call(arguments,0, 2);
        for (var i = 0; i < matches_length; i++) {
            var domobject = matches[i];
            var class_name = domobject.getAttribute('pacaclass');
            var instance;
            if (class_name) {
                instance = DomMapping.__map(domobject, class_name, args);
            }
            if (instance) {
                list.push(instance);
            }
        }
        return list;
    }


})();


