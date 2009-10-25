

var oui = $.ui.resizable.prototype.ui;
$.ui.resizable.prototype.ui = function() {
  var ui = oui.call(this);
  ui.axis = this.axis;
  return ui;
};

function roundby(num,by){
  return parseInt(num/by)*by;
}

function rcolor(){
  return 'hsl(' + parseInt(Math.random()*360) + ', 100%, ' + parseInt(Math.random()*50 + 25) + '%)';
}

var ManageDialog = Class([], {
  __init__:function(self, parent){
    self.parent = parent;
    $("#liveframe-load-dialog").dialog({
      autoOpen: true,
      height: 300,
      closeOnEscape:false,
      resizable:false,
      buttons: {
      },
      close: function() {
      },
      open: function() {
        self.listFrames();
      }
    }).parent().find('.ui-dialog-titlebar-close').unbind('click').click(function(){
      $('#liveframe-load-dialog').parent().toggleClass('minimized');
    });
    $('#liveframe-load-dialog').tabs();
    $('#liveframe-saveload button.save').click(self.saveFrame);
    $('#liveframe-saveload button.load').click(self.loadFrame);
    $('#liveframe-saveload button.remove').click(self.removeFrame);
    $(document).mousedown(function(e){
      if ($('div.liveframe-hover').length){
        $('div.liveframe-hover').removeClass('liveframe-hover');
        $('#liveframe-manage li.selected').removeClass('selected');
      }
    });
    self._send({
      'url':'index.py',
      'data':{'cmd':'get_username'},
      'func': function(res){
        if (!res.loggedin){
          window.location = '../../';
        } else {
          $('#liveframe-load-dialog .ui-dialog-title').html(re.username);
        }
      }
    });
  },
  listFrames: function(self){
    $('#liveframe-load-dialog .frame-list').html('');
    self._send({'url':'index.py','data':{'cmd':'list_frames'},'func': function(res){
      for (var i=0;i<res.frames.length;i++){
        $('<li class="frame-name">'+res.frames[i]+'</li>').appendTo('#liveframe-load-dialog .frame-list').click(function(){
          $('#liveframe-saveload .frame-list li.selected').removeClass('selected');
          $(this).addClass('selected').parent().parent().children('input').val(this.innerHTML);
        }).dblclick(self.loadFrame);
      }
    }});
  },
  loadFrame: function(self){
    var name = $('#liveframe-load-dialog input.name').val();
    self._send({
      'url':'index.py',
      'data':{'cmd':'load','name':name},
      'func': function(res){
        $('#liveframe-main').html(res.html);
        
        $('#liveframe-style').html(res.style);
        $('#liveframe-main div.liveframe-relative, #liveframe-main div.liveframe-absolute').each(function(i,x){
          self.parent.addHandles(x);
          
          var obj = self.parent.cssObj(x);
          var b = obj.css('bottom');
          var w = obj.css('width');
          var r = obj.css('right');
          var h = obj.css('height');
          if (!(!b || (h!=='auto' && h))){
            $(x).addClass('liveframe-bottom');
          }else{
            obj.css('bottom','');
          }
          if (!(!r || (w!=='auto' && w))){
            $(x).addClass('liveframe-right');
          }else{
            obj.css('right','');
          }
          //self.parent.updateBox(x);
        });
        self.listItems();
      }
     });
  },
  removeFrame: function(self){
    var name = $('#liveframe-load-dialog input.name').val();
    self._send({
      'url':'index.py',
      'data':{'cmd':'remove',
          'name':name
      },
      'func': function(res){
        self.listFrames();
        return;
      }
    });
  },
  saveFrame: function(self){
    var name = $('#liveframe-load-dialog input.name').val();
    self._send({
      'url':'index.py',
      'data':{'cmd':'save',
          'name':$('#liveframe-load-dialog input.name').val(),
          'html':self.parent.outputHTML(),
          'style':$('#liveframe-style').cssText().replace(/;\s*/g,';\n  ').replace(/;\s*}/g,';\n}').replace(/(\w){/g,'$1 {')
      },
      'func': function(res){
        self.listFrames();
        return;
      }
    });
  },
  _send: function(self, options){
    options.type = 'json';
    $('#liveframe-load-dialog .loading-indicator').show();
    $.post(options.url, options.data, function(res){
      self.sending = false;
      if (options.type == 'json'){
        if (!res){
          alert('missing '+options.url);
          return;
        }
        try{
          eval('res = '+res);
        }catch(e){
          alert('AJAX Exception: '+res);
        return;
        }
      }
      if (res.error){
        alert("AJAX Exception: "+res.error);
        return;
      }
      options.func.apply(self,[res]);
      $('#liveframe-load-dialog .loading-indicator').hide();
    },'text');
  },
  listItems:function(self){
    var updateshowhide = function(node,li){
      if ($(node).hasClass('liveframe-hidden')){
        li.children('button.showhide').html('show');
      } else {
        li.children('button.showhide').html('hide');
      }
    }
    $('#liveframe-manage ul').html('');
    $('#liveframe-main div.liveframe-relative, #liveframe-main div.liveframe-absolute').each(function(i,x){
      if ($(x).is('div.liveframe-hidden div'))return;
      var li = $('<li><span class="name">'+self.parent.getID(this)+'</span><button type="button" class="showhide ui-state-default ui-corner-all">hide</button></li>').appendTo('#liveframe-manage ul').click(function(){
        if ($(this).hasClass('selected')){
          $(x).removeClass('liveframe-hover');
          return $(this).removeClass('selected');
        }
        $('#liveframe-manage ul li.selected').removeClass('selected');
        $('div.liveframe-relative.liveframe-hover, div.liveframe-absolute.liveframe-hover').removeClass('liveframe-hover');
        $(this).addClass('selected').parent().parent().children('input').val(this.innerHTML);
        $(x).addClass('liveframe-hover');
      }).dblclick(self.editItem(x));
      li.children('button.showhide').click(function(){
        $(x).toggleClass('liveframe-hidden');
        updateshowhide(x, li);
        self.listItems();
      });
      updateshowhide(x, li);
    });
    
  },
  editItem: function(self, item){
    return function(e){
      var node = $(this);
      node.children('.name').html('');
      node.children('button').hide();
      var old = self.parent.getID(item);
      var saveit = function(){
        self.parent._setID(item, name.val());
        node.children('.name').html(self.parent.getID(item));
        node.children('button').show();
      };
      var name = $('<input/>').val(old).appendTo(node.children('.name')).keydown(function(e){
        if (e.keyCode == 13){
          saveit();
        }
      }).blur(saveit);
      name.focus().select();
    };
  }
});

function white(num){
  var r = '';for(var i=0;i<num;i++)r+=' ';return r;
}

function prettyHTML(node, indent){
  indent = indent || 0;
  if (node.nodeName == '#text'){
    return node.textContent.replace(/^\s*/,'').replace(/\s*$/,'');
  }
  var text = white(indent-2) + '<' + node.nodeName.toLowerCase() + ' style="' + node.style.cssText + '" id="' + node.id + '" class="' + node.className + '">\n';
  if (false && !indent)text = '';
  for (var i=0;i<node.childNodes.length;i++){
    text += prettyHTML(node.childNodes[i], indent + 2);
  }
  if (true || indent){
    text += white(indent-2) + '</' + node.nodeName.toLowerCase() + '><!-- end ' + MM.getID(node) + ' -->\n';
  }
  return text;
}

var DesignManager = Class([],{
  __init__:function(self){
    $(document).bind('contextmenu',function(e){
      if (e.button==2){
        var t = $(e.target);
        if (t.hasClass('ui-resizable-handle')){
          if (t.hasClass('ui-resizable-s')){
            t.parent().toggleClass('liveframe-bottom');
          }else if (t.hasClass('ui-resizable-e')){
            t.parent().toggleClass('liveframe-right');
          }
          self.updateBox(t.parent(), e);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      return true;
    });
    self.md = ManageDialog(self);
  },
  newAbsolute:function(self,e){
    var off = $(e.target).offset();
    var grid = 10;
    var np = {'left':parseInt((e.pageX-off.left)/grid)*grid,'top':parseInt((e.pageY-off.top)/grid)*grid}
    var newdiv = $('<div class="liveframe-absolute"></div>').appendTo(e.target);
    self.addHandles(newdiv);
    $(newdiv).css('display','none');
    self.setID({'left':parseInt(e.pageX/grid)*grid,'top':parseInt(e.pageY/grid)*grid}, off, newdiv);
  },
  addHandles:function(self, node){
    $(node).draggable({
        grid:[10,10],
        stop:function(e,ui){
          self.cssObj(this).css('left',$(this).css('left')).css('top',$(this).css('top'));
        }
      })
      .resizable({grid:[10,10],
        resize:function(e,ui){
          self.updateBox(this, e, ui);
          self.updateHover(this, e);
          return false;
        },stop:function(e, ui){
          $("#liveframe-hovertext").hide();
          self.updateBox(this, e, ui);
        },start:function(e, ui){
          self.updateHover(this, e);
        },
        handles:'n, e, s, w, ne, nw, se, sw'
      });
    return node;
  },
  getID: function(self, node){
    var id = '';
    node = $(node)[0];
    if (node.id){
      id += '#'+node.id;
    }
    if (node.className){
      id += '.'+node.className.replace(/ /g,'.');
      id = id.replace(/\.ui-[\w-]+/g, '').replace(/\.liveframe-[\w-]+/g, '');
    }
    if (!id)id='[no id]';
    return id;
  },
  setID: function(self, pos, off, node){
    var old_class = node.className;
    var id = self.getID(node);
    getName(pos, id, self._setNameCB(pos, off, node));
  },
  _setNameCB: function(self, pos, off, node){
    return function(name){
      self._setID(node, name);
      $(node).css('display','');
      self.cssObj(node).css('left', pos.left - off.left).css('top', pos.top - off.top).css('background-color',rcolor());
      self.md.listItems();
    };
  },
  cssObj: function(self, node){
    var cssobj;
    node = $(node);
    var id = self.getID(node);
    if (!id || id == '[no id]'){
      cssobj = node;
    }else{
      cssobj = $.rule(id, '#liveframe-style');
      if (!cssobj.length){
        cssobj = $.rule(id + '{}').appendTo('#liveframe-style');
      }
    }
    var fakeobj = {
      'css':function(attr, value){
        if (typeof(value) === 'undefined'){
          if (cssobj === node)return cssobj[0].style[attr];
          return cssobj.css(attr);
        }
        if (!cssobj.css(attr) && !value)return fakeobj;
        node.css(attr, '');
        cssobj.css(attr, value);
        return fakeobj;
      }
    }
    return fakeobj;
  },
  _setID: function(self, node, name){
    if (!name || name == '[no id]')return;
    var id = '', classN = '';
    node = $(node)[0];
    if (name.indexOf('.')!==-1){
      var parts = name.split('.');
      if (parts[0]){
        id = parts[0].split('#')[1];
      }
      if (id && $('#'+id).length)return;
      classN = parts.slice(1).join(' ');
      node.className = node.className + ' ' + classN;
      node.id = id;
    } else {
      var id = name.split('#').slice(-1)[0];
      if (id && $('#'+id).length)return;
      node.id = id
    }
  },
  removeHandles:function(self, node){
    $(node).draggable('destroy').resizable('destroy');
  },
  updateBox:function(self, node){
    var node = $(node), off = node.offset(), main = $(node.offsetParent()), mof = main.offset();
    if (node.hasClass('liveframe-bottom')){
      self.cssObj(node).css('bottom',roundby(main[0].offsetHeight - (off.top - mof.top + node[0].offsetHeight), 10)).css('height','auto');
    }else{
      self.cssObj(node).css('height',roundby(node[0].offsetHeight, 10)).css('bottom','');
    }
    if (node.hasClass('liveframe-right')){
      self.cssObj(node).css('right',roundby(main[0].offsetWidth - (off.left - mof.left + node[0].offsetWidth), 10)).css('width','auto');
    }else{
      self.cssObj(node).css('width',roundby(node[0].offsetWidth, 10)).css('right','');
    }
  },
  updateHover:function(self, node, e){
    $('#liveframe-hovertext').html(node.offsetWidth+' x '+node.offsetHeight);
    self.updateHoverPos(node, e);
  },
  updateHoverPos:function(self, node, e){
    $('#liveframe-hovertext').css('left',e.pageX + 5 + 'px').css('top',e.pageY + 5 + 'px').show();
    var hv = $('#liveframe-hovertext'), ho = hv.offset(), main = $('#liveframe-main'), mo = main.offset();
    
    if (ho.left + hv[0].offsetWidth > mo.left + main[0].offsetWidth - 10){
      hv.css('left', mo.left + main[0].offsetWidth - hv[0].offsetWidth - 10 + 'px');
    }
    if (ho.top + hv[0].offsetHeight > mo.top + main[0].offsetHeight - 10){
      hv.css('top', mo.top + main[0].offsetHeight - hv[0].offsetHeight - 10 + 'px');
    }
  },
  newRelative:function(self,e){
    var off = $(e.target).offset();
    var div = $('<div class="liveframe-relative"></div>').appendTo(e.target)
      .resizable({grid:[10,10],
        resize:function(e,ui){
          $('#liveframe-hovertext').css('left', e.pageX + 5 + 'px').css('top', e.pageY + 5 + 'px').show().html(div[0].offsetWidth+' x '+div[0].offsetHeight);
          var hv = $('#liveframe-hovertext'), ho = hv.offset(), main = $('#liveframe-main'), mo = main.offset();
          
          if (ho.left + hv[0].offsetWidth > mo.left + main[0].offsetWidth - 10){
            self.cssObj(hv).css('left', mo.left + main[0].offsetWidth - hv[0].offsetWidth - 10 + 'px');
          }
          e.preventDefault();
          return false;
        },stop:function(e, ui){
          $("#liveframe-hovertext").hide();
        },
        handles: 's',
      }).css('background-color', rcolor());
    self.md.listItems();
  },
  
  removeItem: function(self, e){
    $(e.target).remove();
    self.md.listItems();
  },
  
  overflowItem: function(self, e){
    $(e.target).toggleClass('liveframe-overflow');
  },
  
  toggleBottom: function(self, e){
    self.updateBox($(e.target).toggleClass('liveframe-bottom'));
  },
  
  toggleRight: function(self, e){
    self.updateBox($(e.target).toggleClass('liveframe-right'));
  },
  
  outputHTML: function(self){
    var rels = $('#liveframe-main div.liveframe-relative');
    var abss = $('#liveframe-main div.liveframe-absolute');
    rels.each(function(i,x){
      self.removeHandles(x);
      self.cssObj(x).css('position','relative');
      //$(x).removeClass('liveframe-relative');
    });
    abss.each(function(i,x){
      self.removeHandles(x);
      self.cssObj(x).css('position','absolute');
      $(x).removeClass('liveframe-bottom liveframe-right');
    });
    var res = prettyHTML($('#liveframe-main')[0]);
    
    rels.each(function(i,x){
      self.addHandles(x);
      $(x).addClass('liveframe-relative');
    });
    abss.each(function(i,x){
      self.addHandles(x);
      $(x).addClass('liveframe-absolute');
      var obj = self.cssObj(x);
      var b = obj.css('bottom');
      var w = obj.css('width');
      var r = obj.css('right');
      var h = obj.css('height');
      if (!(!b || (h!=='auto' && h))){
        $(x).addClass('liveframe-bottom');
      }else{
        obj.css('bottom','');
      }
      if (!(!r || (w!=='auto' && w))){
        $(x).addClass('liveframe-right');
      }else{
        obj.css('right','');
      }
    });
    return res;
  },
});

function getName(pos, old, callback){
  var node = $('#liveframe-nametip').html('<input class="text ui-widget-content"/>');
  var name = $('input', node);
  name.val(old || '');
  node.css('left',pos.left+5);
  node.css('top',pos.top+5);
  node.show();
  node.mousedown(stopE);
  name.keydown(function(e){
    if (e.keyCode == 13){
      md();
    }
  }).blur(md).focus().select();
  var md = function(){
    node.hide();
    callback(name.val());
  };
}

function killE(e){
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function stopE(e){
  e.stopPropagation();
}

function contextMenu(items) {
  return function(e){
    if (!$(e.target).hasClass('ui-resizable-handle')){
      var div = $('#liveframe-contextmenu').show();
      $('#liveframe-contextmenu .title').html(MM.getID(e.target));
      var idiv = div.children('div.items');
      idiv.html('');
      div.css('left',e.pageX+'px').css('top',e.pageY+'px');
      for (var i=0;i<items.length;i++){
        var sub = $('<div class="menuitem">'+items[i][0]+'</div>').appendTo(idiv);
        $.data(sub[0],'click',items[i][1]);
        sub.mousedown(function(ne){
          $.data(this,'click')(e);
          div.hide();
          ne.preventDefault();
          ne.stopPropagation();
          return false;
        });
     }
    }
    e.stopPropagation();
    e.preventDefault();
    return false;
  };
}


var MM;
$(function(){
  MM = DesignManager();

  $(document).bind('contextmenu',contextMenu([
    ['Add new absolute div',MM.newAbsolute],
    ['Add new relative',MM.newRelative],
    ["Delete",MM.removeItem],
    ["Overflow Show/Hide",MM.overflowItem],
    ["Toggle sticky bottom",MM.toggleBottom],
    ["Toggle sticky right", MM.toggleRight],
  ]));
  $(document).mousedown(function(){$('#liveframe-contextmenu').hide();});

});
