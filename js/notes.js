window.BeyondNotes = (function(){
  "use strict";

  var deps = null;
  var saveTimer = null;
  var selectedId = null;
  var STAGE_W = 4000;
  var STAGE_H = 3000;
  var COLORS = [
    "#111111", "#ffffff", "#ef4444", "#f97316", "#facc15",
    "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"
  ];
  var TOOLS = [
    { id:"select", icon:"↖", label:"Выбор" },
    { id:"pan", icon:"✋", label:"Рука" },
    { id:"pen", icon:"✒️", label:"Ручка" },
    { id:"pencil", icon:"✎", label:"Карандаш" },
    { id:"brush", icon:"🖌", label:"Кисть" },
    { id:"highlighter", icon:"🖍", label:"Маркер" },
    { id:"eraser", icon:"⌫", label:"Ластик" },
    { id:"text", icon:"T", label:"Текст" },
    { id:"sticky", icon:"🗒", label:"Стикер" },
    { id:"image", icon:"🖼", label:"Фото" }
  ];

  function install(hooks){
    deps = hooks;
  }

  function state(){
    return deps && deps.getState ? deps.getState() : null;
  }

  function board(){
    var s = state();
    if(!s) return null;
    migrate(s);
    return s.notesBoard;
  }

  function migrate(s){
    if(!s) return;
    s.notesBoard = s.notesBoard || {
      panX:0, panY:0, zoom:1, tool:"pen", color:"#111111", size:4,
      paperColor:"#ffffff", paperPattern:"grid", gridOpacity:0.28, fullscreen:false,
      objects:[], strokes:[]
    };
    var b = s.notesBoard;
    if(typeof b.panX !== "number") b.panX = 0;
    if(typeof b.panY !== "number") b.panY = 0;
    if(typeof b.zoom !== "number") b.zoom = 1;
    if(!b.tool) b.tool = "pen";
    if(!b.color) b.color = "#111111";
    if(typeof b.size !== "number") b.size = 4;
    if(!b.paperColor) b.paperColor = "#ffffff";
    if(!b.paperPattern || ["grid","lines","blank"].indexOf(b.paperPattern) < 0) b.paperPattern = "grid";
    if(typeof b.gridOpacity !== "number") b.gridOpacity = 0.28;
    b.gridOpacity = clamp(b.gridOpacity, 0.05, 1);
    if(typeof b.fullscreen !== "boolean") b.fullscreen = false;
    if(!Array.isArray(b.objects)) b.objects = [];
    if(!Array.isArray(b.strokes)) b.strokes = [];
  }

  var PAPER_COLORS = [
    { id:"#ffffff", label:"Белый" },
    { id:"#fff8e7", label:"Крем" },
    { id:"#f1f5f9", label:"Серый" },
    { id:"#e0f2fe", label:"Голубой" },
    { id:"#fce7f3", label:"Розовый" },
    { id:"#111827", label:"Чёрный" }
  ];
  var PAPER_PATTERNS = [
    { id:"grid", label:"Клетка", icon:"▦" },
    { id:"lines", label:"Линейка", icon:"≡" },
    { id:"blank", label:"Пустой", icon:"□" }
  ];

  function paperIsDark(hex){
    var h = String(hex || "#ffffff").replace("#", "");
    if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.slice(0, 2), 16) || 0;
    var g = parseInt(h.slice(2, 4), 16) || 0;
    var b = parseInt(h.slice(4, 6), 16) || 0;
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 140;
  }

  function applyPaperStyle(app){
    var b = board();
    if(!app || !b) return;
    var stage = app.querySelector(".notes-stage");
    var viewport = app.querySelector(".notes-viewport");
    if(!stage) return;
    var opacity = clamp(b.gridOpacity, 0.05, 1);
    var dark = paperIsDark(b.paperColor);
    stage.style.setProperty("--paper-color", b.paperColor || "#ffffff");
    stage.style.setProperty("--rule-opacity", String(opacity));
    stage.style.setProperty("--rule-color", dark ? "255, 255, 255" : "30, 40, 60");
    stage.setAttribute("data-pattern", b.paperPattern || "grid");
    if(viewport){
      viewport.style.backgroundColor = b.paperColor || "#ffffff";
    }
    var patternBtns = app.querySelectorAll("[data-action=notes-pattern]");
    for(var i = 0; i < patternBtns.length; i++){
      var on = patternBtns[i].getAttribute("data-pattern") === b.paperPattern;
      patternBtns[i].classList.toggle("is-active", on);
      patternBtns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    var paperBtns = app.querySelectorAll("[data-action=notes-paper]");
    for(var j = 0; j < paperBtns.length; j++){
      var pon = (paperBtns[j].getAttribute("data-paper") || "").toLowerCase() === String(b.paperColor || "").toLowerCase();
      paperBtns[j].classList.toggle("is-active", pon);
      paperBtns[j].setAttribute("aria-pressed", pon ? "true" : "false");
    }
    var opacityInput = app.querySelector("[data-notes-grid-opacity]");
    var opacityOut = app.querySelector(".notes-grid-opacity output");
    if(opacityInput) opacityInput.value = String(Math.round(opacity * 100));
    if(opacityOut) opacityOut.textContent = Math.round(opacity * 100) + "%";
  }

  function applyFullscreen(app){
    var b = board();
    var on = !!(b && b.fullscreen);
    document.documentElement.classList.toggle("notes-is-fullscreen", on);
    if(app){
      app.classList.toggle("is-fullscreen", on);
      var enter = app.querySelector("[data-action=notes-fullscreen]");
      var exit = app.querySelector("[data-action=notes-fullscreen-exit]");
      if(enter) enter.hidden = on;
      if(exit) exit.hidden = !on;
    }
  }

  function e(value){
    if(deps && deps.esc) return deps.esc(value);
    return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }

  function id(){
    return deps && deps.uid ? deps.uid() : "note-" + Math.random().toString(36).slice(2, 10);
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function queueSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      if(deps && deps.save) deps.save();
    }, 400);
  }

  function renderTool(tool, active){
    return '<button class="notes-tool' + (active ? ' is-active' : '') +
      '" type="button" data-action="notes-tool" data-tool="' + tool.id +
      '" title="' + e(tool.label) + '" aria-label="' + e(tool.label) +
      '" aria-pressed="' + (active ? "true" : "false") + '"><span aria-hidden="true">' +
      tool.icon + '</span></button>';
  }

  function renderObject(obj){
    var style = "left:" + Number(obj.x || 0) + "px;top:" + Number(obj.y || 0) +
      "px;width:" + Number(obj.w || 200) + "px;height:" + Number(obj.h || 100) + "px;";
    var selected = obj.id === selectedId ? " is-selected" : "";
    if(obj.type === "text"){
      style += "color:" + e(obj.color || "#111111") + ";font-size:" +
        Number(obj.fontSize || 24) + "px;";
      return '<div class="notes-object notes-text' + selected + '" data-note-id="' +
        e(obj.id) + '" data-note-type="text" style="' + style + '" tabindex="0">' +
        e(obj.text || "Double-click to edit") + '</div>';
    }
    if(obj.type === "sticky"){
      style += "background:" + e(obj.bg || "#fef08a") + ";";
      return '<div class="notes-object notes-sticky' + selected + '" data-note-id="' +
        e(obj.id) + '" data-note-type="sticky" style="' + style + '" tabindex="0">' +
        e(obj.text || "Double-click to edit") + '</div>';
    }
    if(obj.type === "image"){
      return '<div class="notes-object notes-image' + selected + '" data-note-id="' +
        e(obj.id) + '" data-note-type="image" style="' + style + '" tabindex="0">' +
        '<img src="' + e(obj.src || "") + '" alt="Board image" draggable="false"></div>';
    }
    return "";
  }

  function renderBoard(){
    var b = board();
    if(!b) return "";
    var tools = TOOLS.map(function(tool){ return renderTool(tool, b.tool === tool.id); }).join("");
    var colors = COLORS.map(function(color){
      return '<button class="notes-swatch' + (b.color.toLowerCase() === color ? ' is-active' : '') +
        '" type="button" data-action="notes-color" data-color="' + color +
        '" style="--swatch:' + color + '" title="' + color +
        '" aria-label="Color ' + color + '" aria-pressed="' +
        (b.color.toLowerCase() === color ? "true" : "false") + '"></button>';
    }).join("");
    var paperColors = PAPER_COLORS.map(function(p){
      return '<button class="notes-swatch notes-paper-swatch' +
        (String(b.paperColor).toLowerCase() === p.id.toLowerCase() ? ' is-active' : '') +
        '" type="button" data-action="notes-paper" data-paper="' + p.id +
        '" style="--swatch:' + p.id + '" title="Лист: ' + e(p.label) +
        '" aria-label="Цвет листа ' + e(p.label) + '" aria-pressed="' +
        (String(b.paperColor).toLowerCase() === p.id.toLowerCase() ? "true" : "false") + '"></button>';
    }).join("");
    var patterns = PAPER_PATTERNS.map(function(p){
      return '<button class="notes-pattern' + (b.paperPattern === p.id ? ' is-active' : '') +
        '" type="button" data-action="notes-pattern" data-pattern="' + p.id +
        '" title="' + e(p.label) + '" aria-label="' + e(p.label) +
        '" aria-pressed="' + (b.paperPattern === p.id ? "true" : "false") + '">' +
        '<span aria-hidden="true">' + p.icon + '</span><em>' + e(p.label) + '</em></button>';
    }).join("");
    var objects = b.objects.map(renderObject).join("");
    var gridPct = Math.round(clamp(b.gridOpacity, 0.05, 1) * 100);
    var fs = !!b.fullscreen;

    return '' +
      '<section class="notes-app' + (fs ? ' is-fullscreen' : '') + '" aria-label="Notes whiteboard">' +
        '<div class="notes-toolbar" role="toolbar" aria-label="Board tools">' +
          '<div class="notes-tool-group">' + tools + '</div>' +
          '<span class="notes-toolbar-divider" aria-hidden="true"></span>' +
          '<button class="notes-tool" type="button" data-action="notes-fullscreen" title="На весь экран" aria-label="На весь экран"' + (fs ? ' hidden' : '') + '><span aria-hidden="true">⛶</span></button>' +
          '<button class="notes-tool notes-danger" type="button" data-action="notes-clear" title="Очистить доску" aria-label="Очистить доску"><span aria-hidden="true">🗑</span></button>' +
        '</div>' +
        '<button class="notes-exit-fs" type="button" data-action="notes-fullscreen-exit" title="Выйти из полного экрана" aria-label="Выйти из полного экрана"' + (fs ? '' : ' hidden') + '>✕ Выйти</button>' +
        '<div class="notes-viewport" tabindex="0" style="background-color:' + e(b.paperColor || "#ffffff") + ';">' +
          '<div class="notes-stage" data-pattern="' + e(b.paperPattern || "grid") + '" style="width:' + STAGE_W + 'px;height:' + STAGE_H + 'px;--paper-color:' + e(b.paperColor || "#ffffff") + ';--rule-opacity:' + clamp(b.gridOpacity, 0.05, 1) + ';">' +
            '<canvas class="notes-ink" width="' + STAGE_W + '" height="' + STAGE_H + '"></canvas>' +
            '<div class="notes-objects">' + objects + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="notes-controls">' +
          '<div class="notes-control-block">' +
            '<span class="notes-control-label">Чернила</span>' +
            '<div class="notes-colors" aria-label="Цвет рисования">' + colors + '</div>' +
          '</div>' +
          '<div class="notes-control-block">' +
            '<span class="notes-control-label">Лист</span>' +
            '<div class="notes-colors" aria-label="Цвет листа">' + paperColors + '</div>' +
          '</div>' +
          '<div class="notes-control-block notes-patterns" aria-label="Разметка">' + patterns + '</div>' +
          '<label class="notes-size" title="Толщина"><span>Толщина</span>' +
            '<input type="range" min="1" max="40" step="1" value="' + clamp(b.size, 1, 40) +
            '" data-notes-size aria-label="Толщина линии"><output>' + clamp(b.size, 1, 40) + '</output></label>' +
          '<label class="notes-size notes-grid-opacity" title="Чёткость разметки"><span>Разметка</span>' +
            '<input type="range" min="5" max="100" step="1" value="' + gridPct +
            '" data-notes-grid-opacity aria-label="Прозрачность разметки"><output>' + gridPct + '%</output></label>' +
        '</div>' +
        '<div class="notes-zoom" aria-label="Масштаб">' +
          '<button type="button" data-action="notes-zoom-out" title="Мельче" aria-label="Мельче">−</button>' +
          '<button type="button" data-action="notes-zoom-reset" class="notes-zoom-value" title="Сбросить масштаб">' +
            Math.round(b.zoom * 100) + '%</button>' +
          '<button type="button" data-action="notes-zoom-in" title="Крупнее" aria-label="Крупнее">+</button>' +
        '</div>' +
        '<button class="notes-delete-selection" type="button" data-action="notes-delete-selected"' +
          (selectedId ? '' : ' hidden') + '>Удалить</button>' +
        '<input class="notes-image-input" type="file" accept="image/*" hidden>' +
      '</section>';
  }

  function drawStroke(ctx, stroke){
    var points = stroke.points || [];
    if(!points.length) return;
    var width = Number(stroke.size || 4);
    if(stroke.tool === "pencil") width = Math.max(1, width * 0.72);
    if(stroke.tool === "brush") width = width * 1.8;
    if(stroke.tool === "highlighter") width = width * 2.5;
    ctx.save();
    ctx.globalAlpha = typeof stroke.opacity === "number" ? stroke.opacity : 1;
    ctx.strokeStyle = stroke.color || "#111111";
    ctx.fillStyle = stroke.color || "#111111";
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if(stroke.tool === "brush") ctx.shadowBlur = width * 0.35;
    if(stroke.tool === "brush") ctx.shadowColor = stroke.color || "#111111";
    if(points.length === 1){
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
      ctx.fill();
    }else{
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for(var i = 1; i < points.length; i++){
        var previous = points[i - 1];
        var current = points[i];
        var middleX = (previous.x + current.x) / 2;
        var middleY = (previous.y + current.y) / 2;
        ctx.quadraticCurveTo(previous.x, previous.y, middleX, middleY);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function redraw(canvas){
    var b = board();
    if(!canvas || !b) return;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    b.strokes.forEach(function(stroke){ drawStroke(ctx, stroke); });
  }

  function applyTransform(app){
    var b = board();
    var stage = app && app.querySelector(".notes-stage");
    if(!stage || !b) return;
    stage.style.transform = "translate(" + b.panX + "px," + b.panY + "px) scale(" + b.zoom + ")";
    var zoomValue = app.querySelector(".notes-zoom-value");
    if(zoomValue) zoomValue.textContent = Math.round(b.zoom * 100) + "%";
  }

  function stagePoint(event, viewport){
    var b = board();
    var rect = viewport.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left - b.panX) / b.zoom, 0, STAGE_W),
      y: clamp((event.clientY - rect.top - b.panY) / b.zoom, 0, STAGE_H)
    };
  }

  function strokeOpacity(tool){
    if(tool === "pencil") return 0.75;
    if(tool === "brush") return 0.55;
    if(tool === "highlighter") return 0.35;
    return 1;
  }

  function eraseAt(point, radius){
    var b = board();
    var changed = false;
    b.strokes = b.strokes.filter(function(stroke){
      var oldPoints = stroke.points || [];
      var kept = oldPoints.filter(function(p){
        var dx = p.x - point.x;
        var dy = p.y - point.y;
        return dx * dx + dy * dy > radius * radius;
      });
      if(kept.length !== oldPoints.length) changed = true;
      stroke.points = kept;
      return kept.length > 1;
    });
    return changed;
  }

  function findObject(objectId){
    var b = board();
    if(!b) return null;
    for(var i = 0; i < b.objects.length; i++){
      if(b.objects[i].id === objectId) return b.objects[i];
    }
    return null;
  }

  function refreshSelection(app){
    var nodes = app.querySelectorAll(".notes-object");
    for(var i = 0; i < nodes.length; i++){
      nodes[i].classList.toggle("is-selected", nodes[i].getAttribute("data-note-id") === selectedId);
    }
    var button = app.querySelector(".notes-delete-selection");
    if(button) button.hidden = !selectedId;
  }

  function addTextObject(point, type){
    var b = board();
    var obj;
    if(type === "sticky"){
      obj = { id:id(), type:"sticky", x:point.x, y:point.y, w:220, h:180, text:"New note", bg:"#fef08a" };
    }else{
      obj = { id:id(), type:"text", x:point.x, y:point.y, w:260, h:70, text:"New text", color:b.color, fontSize:24 };
    }
    b.objects.push(obj);
    selectedId = obj.id;
    queueSave();
    if(deps && deps.render) deps.render();
  }

  function deleteSelected(){
    var b = board();
    if(!b || !selectedId) return;
    var length = b.objects.length;
    b.objects = b.objects.filter(function(obj){ return obj.id !== selectedId; });
    if(b.objects.length !== length){
      selectedId = null;
      queueSave();
      if(deps && deps.render) deps.render();
    }
  }

  function placeImage(dataUrl, width, height){
    var app = document.querySelector(".notes-app");
    var viewport = app && app.querySelector(".notes-viewport");
    var b = board();
    if(!viewport || !b) return;
    var displayScale = Math.min(1, 480 / width, 360 / height);
    var w = Math.max(80, Math.round(width * displayScale));
    var h = Math.max(60, Math.round(height * displayScale));
    var rect = viewport.getBoundingClientRect();
    var x = (rect.width / 2 - b.panX) / b.zoom - w / 2;
    var y = (rect.height / 2 - b.panY) / b.zoom - h / 2;
    var obj = {
      id:id(), type:"image", x:clamp(x, 0, STAGE_W - w), y:clamp(y, 0, STAGE_H - h),
      w:w, h:h, src:dataUrl
    };
    b.objects.push(obj);
    selectedId = obj.id;
    queueSave();
    if(deps && deps.render) deps.render();
  }

  function loadImageFile(file){
    if(!file || !/^image\//i.test(file.type || "")) return;
    var reader = new FileReader();
    reader.onload = function(){
      var image = new Image();
      image.onload = function(){
        var scale = Math.min(1, 800 / Math.max(image.width, image.height));
        var width = Math.max(1, Math.round(image.width * scale));
        var height = Math.max(1, Math.round(image.height * scale));
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        var mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        placeImage(canvas.toDataURL(mime, 0.84), width, height);
      };
      image.onerror = function(){
        if(deps && deps.toast) deps.toast("Could not read that image", "info");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function bindObjectEditing(app, viewport){
    var objectsLayer = app.querySelector(".notes-objects");
    if(!objectsLayer) return;

    objectsLayer.addEventListener("dblclick", function(event){
      var node = event.target.closest ? event.target.closest(".notes-object") : null;
      if(!node || node.getAttribute("data-note-type") === "image") return;
      event.stopPropagation();
      selectedId = node.getAttribute("data-note-id");
      node.setAttribute("contenteditable", "true");
      node.classList.add("is-editing");
      node.focus();
      var range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });

    objectsLayer.addEventListener("input", function(event){
      var node = event.target.closest ? event.target.closest(".notes-object[contenteditable=true]") : null;
      if(!node) return;
      var obj = findObject(node.getAttribute("data-note-id"));
      if(obj){
        obj.text = node.textContent;
        queueSave();
      }
    });

    objectsLayer.addEventListener("focusout", function(event){
      var node = event.target.closest ? event.target.closest(".notes-object[contenteditable=true]") : null;
      if(!node) return;
      node.removeAttribute("contenteditable");
      node.classList.remove("is-editing");
    });
  }

  function afterRender(){
    var app = document.querySelector(".notes-app");
    if(!app) return;
    var b = board();
    var viewport = app.querySelector(".notes-viewport");
    var canvas = app.querySelector(".notes-ink");
    redraw(canvas);
    applyTransform(app);
    applyPaperStyle(app);
    applyFullscreen(app);
    if(app.dataset.bound) return;
    app.dataset.bound = "1";

    var drawing = false;
    var panning = false;
    var draggingObject = null;
    var activeStroke = null;
    var lastClient = null;
    var spaceDown = false;

    viewport.addEventListener("keydown", function(event){
      if(event.code === "Space" && !event.target.isContentEditable){
        spaceDown = true;
        viewport.classList.add("is-space-pan");
        event.preventDefault();
      }
      if((event.key === "Delete" || event.key === "Backspace") && !event.target.isContentEditable && selectedId){
        event.preventDefault();
        deleteSelected();
      }
      if(event.key === "Escape"){
        if(event.target.isContentEditable){
          event.target.blur();
        } else if(b && b.fullscreen){
          b.fullscreen = false;
          applyFullscreen(app);
          queueSave();
        }
      }
    });
    viewport.addEventListener("keyup", function(event){
      if(event.code === "Space"){
        spaceDown = false;
        viewport.classList.remove("is-space-pan");
      }
    });
    viewport.addEventListener("blur", function(){
      spaceDown = false;
      viewport.classList.remove("is-space-pan");
    });

    viewport.addEventListener("pointerdown", function(event){
      if(event.button !== 0 && event.button !== 1) return;
      if(event.target.isContentEditable) return;
      viewport.focus({ preventScroll:true });
      var objectNode = event.target.closest ? event.target.closest(".notes-object") : null;
      if(objectNode){
        selectedId = objectNode.getAttribute("data-note-id");
        refreshSelection(app);
        if(b.tool === "select"){
          var obj = findObject(selectedId);
          var start = stagePoint(event, viewport);
          draggingObject = { obj:obj, dx:start.x - obj.x, dy:start.y - obj.y };
          objectNode.classList.add("is-dragging");
          viewport.setPointerCapture(event.pointerId);
          event.preventDefault();
        }
        return;
      }

      if(b.tool === "select"){
        selectedId = null;
        refreshSelection(app);
        return;
      }
      if(b.tool === "text" || b.tool === "sticky"){
        addTextObject(stagePoint(event, viewport), b.tool);
        return;
      }
      if(b.tool === "image"){
        var input = app.querySelector(".notes-image-input");
        if(input) input.click();
        return;
      }
      if(b.tool === "pan" || spaceDown || event.button === 1){
        panning = true;
        lastClient = { x:event.clientX, y:event.clientY };
        viewport.classList.add("is-panning");
        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if(b.tool === "eraser"){
        drawing = true;
        eraseAt(stagePoint(event, viewport), Math.max(8, b.size * 2));
        redraw(canvas);
        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if(["pen", "pencil", "brush", "highlighter"].indexOf(b.tool) !== -1){
        drawing = true;
        activeStroke = {
          id:id(), tool:b.tool, color:b.color, size:b.size,
          points:[stagePoint(event, viewport)], opacity:strokeOpacity(b.tool)
        };
        b.strokes.push(activeStroke);
        redraw(canvas);
        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
      }
    });

    viewport.addEventListener("pointermove", function(event){
      if(draggingObject && draggingObject.obj){
        var dragPoint = stagePoint(event, viewport);
        draggingObject.obj.x = clamp(dragPoint.x - draggingObject.dx, 0, STAGE_W - draggingObject.obj.w);
        draggingObject.obj.y = clamp(dragPoint.y - draggingObject.dy, 0, STAGE_H - draggingObject.obj.h);
        var node = app.querySelector('[data-note-id="' + selectedId + '"]');
        if(node){
          node.style.left = draggingObject.obj.x + "px";
          node.style.top = draggingObject.obj.y + "px";
        }
        queueSave();
        event.preventDefault();
        return;
      }
      if(panning && lastClient){
        b.panX += event.clientX - lastClient.x;
        b.panY += event.clientY - lastClient.y;
        lastClient = { x:event.clientX, y:event.clientY };
        applyTransform(app);
        event.preventDefault();
        return;
      }
      if(!drawing) return;
      var point = stagePoint(event, viewport);
      if(b.tool === "eraser"){
        if(eraseAt(point, Math.max(8, b.size * 2))) redraw(canvas);
      }else if(activeStroke){
        var points = activeStroke.points;
        var previous = points[points.length - 1];
        var dx = point.x - previous.x;
        var dy = point.y - previous.y;
        if(dx * dx + dy * dy >= 1){
          points.push(point);
          redraw(canvas);
        }
      }
      event.preventDefault();
    });

    function finishPointer(event){
      if(!drawing && !panning && !draggingObject) return;
      drawing = false;
      panning = false;
      activeStroke = null;
      lastClient = null;
      draggingObject = null;
      viewport.classList.remove("is-panning");
      var dragged = app.querySelector(".notes-object.is-dragging");
      if(dragged) dragged.classList.remove("is-dragging");
      if(event.pointerId !== undefined && viewport.hasPointerCapture(event.pointerId)){
        viewport.releasePointerCapture(event.pointerId);
      }
      queueSave();
    }
    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);

    viewport.addEventListener("wheel", function(event){
      if(!event.ctrlKey && Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      var rect = viewport.getBoundingClientRect();
      var cursorX = event.clientX - rect.left;
      var cursorY = event.clientY - rect.top;
      var stageX = (cursorX - b.panX) / b.zoom;
      var stageY = (cursorY - b.panY) / b.zoom;
      var factor = event.deltaY < 0 ? 1.1 : 0.9;
      b.zoom = clamp(b.zoom * factor, 0.2, 3);
      b.panX = cursorX - stageX * b.zoom;
      b.panY = cursorY - stageY * b.zoom;
      applyTransform(app);
      queueSave();
    }, { passive:false });

    var sizeInput = app.querySelector("input[data-notes-size]");
    if(sizeInput){
      sizeInput.addEventListener("input", function(){
        b.size = clamp(Number(sizeInput.value) || 1, 1, 40);
        var output = sizeInput.parentNode.querySelector("output");
        if(output) output.textContent = b.size;
        queueSave();
      });
    }

    var gridOpacityInput = app.querySelector("input[data-notes-grid-opacity]");
    if(gridOpacityInput){
      gridOpacityInput.addEventListener("input", function(){
        b.gridOpacity = clamp((Number(gridOpacityInput.value) || 28) / 100, 0.05, 1);
        applyPaperStyle(app);
        queueSave();
      });
    }

    var imageInput = app.querySelector(".notes-image-input");
    if(imageInput){
      imageInput.addEventListener("change", function(){
        if(imageInput.files && imageInput.files[0]) loadImageFile(imageInput.files[0]);
        imageInput.value = "";
      });
    }
    bindObjectEditing(app, viewport);
  }

  function updateToolbar(app){
    var b = board();
    if(!app || !b) return;
    var tools = app.querySelectorAll("[data-action=notes-tool]");
    var colors = app.querySelectorAll("[data-action=notes-color]");
    for(var i = 0; i < tools.length; i++){
      var toolActive = tools[i].getAttribute("data-tool") === b.tool;
      tools[i].classList.toggle("is-active", toolActive);
      tools[i].setAttribute("aria-pressed", toolActive ? "true" : "false");
    }
    for(var j = 0; j < colors.length; j++){
      var colorActive = colors[j].getAttribute("data-color").toLowerCase() === b.color.toLowerCase();
      colors[j].classList.toggle("is-active", colorActive);
      colors[j].setAttribute("aria-pressed", colorActive ? "true" : "false");
    }
  }

  function changeZoom(factor, reset){
    var b = board();
    var app = document.querySelector(".notes-app");
    var viewport = app && app.querySelector(".notes-viewport");
    if(!b) return;
    if(reset){
      b.zoom = 1;
      b.panX = 0;
      b.panY = 0;
    }else if(viewport){
      var rect = viewport.getBoundingClientRect();
      var x = rect.width / 2;
      var y = rect.height / 2;
      var sx = (x - b.panX) / b.zoom;
      var sy = (y - b.panY) / b.zoom;
      b.zoom = clamp(b.zoom * factor, 0.2, 3);
      b.panX = x - sx * b.zoom;
      b.panY = y - sy * b.zoom;
    }else{
      b.zoom = clamp(b.zoom * factor, 0.2, 3);
    }
    applyTransform(app);
    queueSave();
  }

  function clearBoard(){
    var doClear = function(){
      var b = board();
      b.objects = [];
      b.strokes = [];
      selectedId = null;
      if(deps && deps.save) deps.save();
      if(deps && deps.toast) deps.toast("Доска очищена", "info");
      else if(deps && deps.render) deps.render();
    };
    if(deps && typeof deps.askConfirm === "function"){
      deps.askConfirm("Очистить всю доску заметок?", doClear);
    }else if(window.confirm("Очистить всю доску заметок?")){
      doClear();
    }
  }

  function handleAction(action, el){
    var b = board();
    if(!b) return false;
    if(action === "notes-tool"){
      b.tool = el && el.dataset ? el.dataset.tool : b.tool;
      updateToolbar(document.querySelector(".notes-app"));
      queueSave();
      if(b.tool === "image"){
        var imageInput = document.querySelector(".notes-app .notes-image-input");
        if(imageInput) imageInput.click();
      }
      return true;
    }
    if(action === "notes-color"){
      b.color = el && el.dataset ? el.dataset.color : b.color;
      updateToolbar(document.querySelector(".notes-app"));
      queueSave();
      return true;
    }
    if(action === "notes-clear"){ clearBoard(); return true; }
    if(action === "notes-delete-selected"){ deleteSelected(); return true; }
    if(action === "notes-zoom-in"){ changeZoom(1.2, false); return true; }
    if(action === "notes-zoom-out"){ changeZoom(1 / 1.2, false); return true; }
    if(action === "notes-zoom-reset"){ changeZoom(1, true); return true; }
    if(action === "notes-paper"){
      b.paperColor = el && el.dataset ? el.dataset.paper : b.paperColor;
      applyPaperStyle(document.querySelector(".notes-app"));
      queueSave();
      return true;
    }
    if(action === "notes-pattern"){
      b.paperPattern = el && el.dataset ? el.dataset.pattern : b.paperPattern;
      applyPaperStyle(document.querySelector(".notes-app"));
      queueSave();
      return true;
    }
    if(action === "notes-fullscreen"){
      b.fullscreen = true;
      applyFullscreen(document.querySelector(".notes-app"));
      queueSave();
      if(deps && deps.render) deps.render();
      return true;
    }
    if(action === "notes-fullscreen-exit"){
      b.fullscreen = false;
      applyFullscreen(document.querySelector(".notes-app"));
      queueSave();
      if(deps && deps.render) deps.render();
      return true;
    }
    return false;
  }

  function handleForm(){
    return false;
  }

  function getTopbarTitles(){
    return { notes:"Заметки" };
  }

  return {
    install:install,
    migrate:migrate,
    renderBoard:renderBoard,
    afterRender:afterRender,
    handleAction:handleAction,
    handleForm:handleForm,
    getTopbarTitles:getTopbarTitles
  };
})();
