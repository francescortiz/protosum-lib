window.FrameEvent = ProtoSum('FrameEvent', PCEvent);
(function () {
    var proto = FrameEvent.prototype;

    FrameEvent.FRAME_EVENT = "FRAME_EVENT";

    proto.__init__ = function (current_time, time_offset) {
        this.name = FrameEvent.FRAME_EVENT;
        this.current_time = current_time;
        this.time_offset = time_offset;
    }

})();

window.Scene = ProtoSum('Scene', NativeDomObject, PCEventDispatcher);
(function () {
    var proto = Scene.prototype;

    proto.last_time = 0;

//    proto.__init__ = function (node, content_node) {
//        this.getSuper(NativeDomObject).__init__.call(this, node, content_node);
//    }

    proto.setFps = function (fps) {
        this.frame_duration = Math.floor(1000 / fps);
        //this.last_time = new Date().getTime();
        this.frame_dispatcher();
    }

    proto.frame_dispatcher = function () {
        var current_time = new Date().getTime() - 1355000000000;
        if (!this.last_time) {
            this.last_time = current_time;
        }
        var time_offset = current_time - this.last_time;
        this.last_time = current_time;
        this.dispatchEvent(new FrameEvent(current_time, time_offset));
        this.timeoutId = setTimeout(this.frame_dispatcher.bind(this), this.frame_duration);
    }

    proto.pause = function () {
        clearTimeout(this.timeoutId);
    }

    proto.resume = function () {
        this.frame_dispatcher();
    }

})();

window.PCEntity = ProtoSum('PCEntity', NativeDisplayObject, PCEventDispatcher);
(function () {
    var proto = PCEntity.prototype;

    proto.x = 0;
    proto.y = 0;
    proto.w = 0;
    proto.h = 0;
    proto.rotation = 0;
    proto.direction = 0;
    proto.scene = undefined;
    proto.renderizable = undefined;

    /**
     *
     * @param renderizable Renderizable
     */
    proto.__init__ = function (renderizable) {
        this.getSuper(NativeDisplayObject).__init__.call(this, renderizable.node);
        this.renderizable = renderizable;
    }

    proto.setRenderizable = function (renderizable) {
        this.renderizable = renderizable;
        this.node = renderizable.node;
    }

    proto.frame = function (event) {
        this.renderizable.render(this);
    }

    proto.setScene = function (scene) {
        if (this.scene) {
            this.scene.removeEventListener(FrameEvent.FRAME_EVENT, this.frame, this)
            this.scene.removeChild(this);
        }
        this.scene = scene;
        if (scene) {
            scene.addChild(this);
            scene.addEventListener(FrameEvent.FRAME_EVENT, this.frame, this);
        }
    }

})();

window.AliveEntity = ProtoSum('AliveEntity', PCEntity);
(function () {
    var proto = AliveEntity.prototype;

    proto.speed = .1;

    proto.frame = function (event) {
        var speed_x = Math.cos(this.direction) * this.speed * event.time_offset;
        var speed_y = Math.sin(this.direction) * this.speed * event.time_offset;
        this.x += speed_x;
        this.y += speed_y;
        this.getSuper(PCEntity).frame.call(this, event);
    }

})();


window.Renderizable = ProtoSum('Renderizable', NativeDisplayObject, PCEventDispatcher);
(function () {
    var proto = Renderizable.prototype;

    proto.__init__ = function (node) {
        this.getSuper(PCEventDispatcher).__init__.call(this);
        this.getSuper(NativeDisplayObject).__init__.call(this, node);
    }

    proto.render = function (entity) {
        throw new Error("Renderizable.render must be overriden");
    }

})();

window.RImage = ProtoSum('RImage', Renderizable);
(function () {
    var proto = RImage.prototype;

    proto.__init__ = function (src) {
        var img = document.createElement("img");
        img.src = src;
        img.setAttribute("class", "renderizable");
        this.getSuper(Renderizable).__init__.call(this, img);
    }

    proto.render = function (entity) {
        try {
            this.style.left = entity.x + "px";
            this.style.top = entity.y + "px";
            this.style.width = entity.w + "px";
            this.style.height = entity.h + "px";
            this.style.transform = "rotate(" + entity.rotation + "rad)";
            if (window.oldIE) {
                var M11 = Math.cos(entity.rotation);
                var M12 = -Math.sin(entity.rotation);
                var M21 = Math.sin(entity.rotation);
                var M22 = Math.cos(entity.rotation);
                this.style.filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11 = " + M11 + "2, M12 = " + M12 + ",M21 = " + M21 + ", M22 = " + M22 + ")";
            }
            var transform = "rotate(" + entity.rotation + "rad)";
            this.style.msTransform = transform;
            this.style.MozTransform = transform;
            this.style.OTransform = transform;
            this.style.WebkitTransform = transform;
            this.style.transform = transform;

        } catch (e) {
        }
    }

})();


window.RImageSequence = ProtoSum('RImageSequence', Renderizable);
(function () {
    var proto = RImageSequence.prototype;

    proto.frame_list = undefined;
    proto.img_list = [];
    proto.current_frame = 0;
    proto.num_frames = undefined;

    proto.__init__ = function (frame_list) {
        var img = document.createElement("img");
        img.src = frame_list[0];
        img.setAttribute("class", "renderizable");
        this.frame_list = frame_list;
        this.getSuper(Renderizable).__init__.call(this, img);
        this.num_frames = frame_list.length;
        for (var i = 0; i < this.num_frames; i++) {
            var img = document.createElement("img");
            img.src = frame_list[i];
            this.img_list.push(img);
        }
    }

    proto.render = function (entity) {

        this.current_frame = Math.floor(new Date().getTime() / 1000 * 60);
        this.current_frame %= this.num_frames;
        this.node.src = this.img_list[this.current_frame].src;

        try {
            this.style.left = Math.round(entity.x) + "px";
            this.style.top = entity.y + "px";
            this.style.width = entity.w + "px";
            this.style.height = entity.h + "px";
            if (window.oldIE) {
                var M11 = Math.cos(entity.rotation);
                var M12 = -Math.sin(entity.rotation);
                var M21 = Math.sin(entity.rotation);
                var M22 = Math.cos(entity.rotation);
                this.style.filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11 = " + M11 + "2, M12 = " + M12 + ",M21 = " + M21 + ", M22 = " + M22 + ")";
            }
            var transform = "rotate(" + entity.rotation + "rad)";
            this.style.msTransform = transform;
            this.style.MozTransform = transform;
            this.style.OTransform = transform;
            this.style.WebkitTransform = transform;
            this.style.transform = transform;
        } catch (e) {
        }
    }

})();