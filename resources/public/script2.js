function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}

if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i=0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    };
  })();
};

var values = function (object)
    {
        var result = [];
        for (var key in object)
            result.push(object[key]);
        return result;
    };

if (!Array.prototype.reduce) {
  Array.prototype.reduce = function reduce(accumulator){
    if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
    var i = 0, l = this.length >> 0, curr;

    if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
      throw new TypeError("First argument is not callable");

    if(arguments.length < 2) {
      if (l === 0) throw new TypeError("Array length is 0 and no second argument");
      curr = this[0];
      i = 1; // start accumulating at the second element
    }
    else
      curr = arguments[1];

    while (i < l) {
      if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
      ++i;
    }

    return curr;
  };
}

var frequencies = function(a) {
 var b = {}, i = a.length, j;
 while( i-- ) {
   j = b[a[i]];
   b[a[i]] = j ? j+1 : 1;
 }
 return b;
}
var assocIn = function (m, ks, v){
    if(!m){
        m = {};
    }
    if(ks.length > 1){
        m[ks[0]] =  assocIn(m[ks[0]], ks.splice(1), v);
    }
    else{
        if(ks.length == 1){
            m[ks[0]] = v;
        }
    }
    return m;
};

var trueish = function(s){
  return s != null && ( s == true || (typeof(s) == "string" && ( s.toLowerCase()  == "true" || s.toLowerCase() == "yes" || s == "1")));
}

var theaters = {'australia': 2, 'south america' : 2, 'middle east' : 3, 'africa' : 4, 'north america' : 5, 'europe' : 6, 'asia' : 6};
var filterTerritory = function(key, value, not){
    var f = function(){ return  this.attributes[key] == value;};
    var terris = $(territories.features).filter(function(){ return this.geometry && this.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon";});
    if (not != true) {
        return terris.filter(f);
    }else{
        return terris.not(f);
    }
};

var getInfo = function(parent){
    var m = {};
    $(parent).each(function(){
        assocIn(m, this.name.split("."), $(this).val());
    });
    return m;
};


var getMapInfo = function(){
    return getInfo("#edit .map input, #edit .map select");
};

var updatePoints = function(feature){
    for (var key in feature.attributes){
        if (feature.attributes.hasOwnProperty(key)) {
            var value = feature.attributes[key];
            if(value.position){
                $(territories.features).filter(function(){return this.geometry.id == value.id;}).each(function(){this.destroy();});

                var point,p;

                if(typeof(value.position) == "string"){
                    p = new OpenLayers.Geometry.fromWKT(value.position);
                    p.id = value.id;
                }else{
                    p = new OpenLayers.Geometry.Point(value.position.x, value.position.y);
                    p.id = value.position.id;
                }
                point = new OpenLayers.Feature.Vector(p);

                point.attributes = assocIn(point.attributes, ["type"], key);
                point.attributes = assocIn(point.attributes, ["army"], feature.attributes.army);
                point.attributes = assocIn(point.attributes, ["available"], feature.attributes[key].available);
                point.attributes = assocIn(point.attributes, ["parent"], feature);
                feature.attributes[key].position = point.geometry;
                territories.addFeatures([point]);
            }
        }
    };
};


var updateTerritory = function(){
    selectedFeature.attributes = getInfo("#edit .info span input, #edit .info span select");
    updateWCP();
    updatePoints(selectedFeature);
    territories.redraw();
};

var neighbors =  function(feature, army){
    return $(territories.features).filter(function(){return this.geometry && this.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon";})
        .filter(function(){return (army? this.attributes.army == army: true) && feature != this && feature.geometry.intersects(this.geometry);})};

var updateWCP  = function(){
    if(territories.features.length > 0){
        var territoryCount = function(army){return $(filterTerritory("army",army))
                                            .filter(function(){return this.geometry &&
                                                               this.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon";}).length;};
        var divitionCount = function(army){
            var terrs = $.map(filterTerritory('army',army), function(t){var d = (t.attributes && t.attributes.divitions?
                                                                                 t.attributes.divitions.available : 0);
                                                                        return (isNumber(d)? parseInt(d) : 0);});
            return (terrs.length > 0 ? terrs.reduce(function(a,b){return a + b;}): 0);
        };
        var tb = $.map(Object.keys(theaters),function(key){
            var res = new Object();
            res.theater = key;
            var armys = Object.keys(frequencies($.map(filterTerritory("theater", key), function(t){return t.attributes.army;})));
            res.army = (armys.length == 1 ? armys[0] : ""); return res;  });

        var getArmyCPs = function(army){
            var bonuses = $.map($(tb).filter(function(){return this.army == army;}),
                                function(t){ return theaters[t.theater] - 0; });
            if(bonuses != null && bonuses.length > 0 ){
                bonuses = bonuses.reduce(function(a,b){return a + b;});
            }else{
                bonuses = 0;
            }
            return (territoryCount(army)  - 0) + (bonuses - 0);
        };

        var t1 = territoryCount(map.armies[0].name);
        var t2 = territoryCount(map.armies[1].name);
        var tt = t1 + t2;
        var cp1 = getArmyCPs(map.armies[0].name);
        var cp2 = getArmyCPs(map.armies[1].name);
        var cpt = cp1 + cp1;
        var tp1 = (t1 > 0? (t1 / tt * 100 ).toFixed(2): 0);
        var tp2 = (t2 > 0? (t2 / tt * 100 ).toFixed(2): 0);
        var cpp1 = (cp1 > 0? (cp1 / cpt * 100 ).toFixed(2): 0);
        var cpp2 = (cp2 > 0? (cp2 / cpt * 100 ).toFixed(2): 0);
        $("#wcp .a1").text( map.armies[0].name +" territory: " + tp1 + "% wcp: " + cpp1 + "% divitions: " + divitionCount(map.armies[0].name));
        $("#wcp .a2").text( map.armies[1].name +" territory: " + tp2 + "% wcp: " + cpp2 + "% divitions: " + divitionCount(map.armies[1].name));
        $("#wcp .a1").attr("style", "color:" + map.armies[0].strokeColor);
        $("#wcp .a2").attr("style", "color:" + map.armies[1].strokeColor);
    }

}

var map, selectControl, selectedFeature,updateMap, loadMap, getMap, territories, featuresm, mf, dc, dragFeature,svgw;
var editAttributes = false;
var editGeometry = false;

var getConfig = function(collection, ignore, hidden, prename){
    if(ignore == null){
        ignore = ["features"];
    }
    if(hidden == null){
        hidden = ["id", "edit"];
    }
    if(prename == null){
        prename = "";
    }
    return $(Object.keys(collection)).sort().map(
        function(){
            var res = "";
            var key = this.toString();
            var val = collection[this];
            if(ignore.indexOf(key) == -1){
                if(typeof(val) == 'object' && (!val['id'] || val['position'])){
                    res += "<span class='m " + key + "'>" +
                        (prename != "" || val['position']? "<label> " + prename + key + "</label>": "") +
                        getConfig(val, ignore, hidden, prename + key + "." ) +
                        "</span>";
                }
                else{
                    if(hidden.indexOf(key) != -1){
                        res += "<input name='" +
                            prename + key +
                            "' type='hidden' value='" +
                            val +
                            "' class='positionId' />";
                    }else{
                        res += "<span>" +
                            "<label> " +
                            key +
                            "</label>"  +
                            "<input name='" +
                            prename + key +
                            "' type='text' value='" +
                            val +
                            "'" +
                            (key.toLowerCase().indexOf("color") != -1? " class=\"hex\" " :" ") +
                            " />" +
                            (key == "position"? "<label class='move'>move</label>" + "<input name='edit' type='checkbox' class='possitionEdit' />"
                             + ( val.id ?
                                 "<input type='hidden' name='" + prename + "id' value='"+ val.id  +"' class='positionId' />" : "") : "") +
                            "</span>";
                    }
                }
            }
            return res;
        }).toArray().reduce(function(a,b){
            return a + b;
        });
};

var defaultpositionKeys = ["hq", "aa", "ab", "fob", "divitions", "label"];

var ensurePoints = function(feature, ks){
    if(ks == null){
        ks = defaultpositionKeys;
    }
    if(!feature.attributes.label){
        feature.attributes.label = "";
    }
    for(var key in feature.attributes){
        if(ks.indexOf(key) != -1 && typeof(feature.attributes[key]) == "string"){
            var val = feature.attributes[key];
            if(!isNumber(val)){
                val = trueish(val);
            }
            feature.attributes[key] = {};
            feature.attributes[key].available = val;
            feature.attributes[key].position = feature.geometry.getCentroid();
            if(key == "label"){
                if(feature.attributes["xOffset"] != null || feature.attributes["yOffset"] != null){
                    feature.attributes[key].available = true;

                    delete feature.attributes["xOffset"];
                    delete feature.attributes["yOffset"];
                }
            }
        }
    }
    return feature;
};

function onPopupClose(evt) {
    selectControl.unselect(selectedFeature);
}
function onFeatureSelect(feature) {


    if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"
      && feature.attributes.parent){
        if(feature.attributes.parent.CLASS_NAME == "OpenLayers.Feature.Vector"){
            feature = feature.attributes.parent;
            selectControl.feature = feature;
        }else{
            if(typeof(feature.attributes.parent) == "string"){
                var p = territories.getFeatureById(feature.attributes.parent);
                if(p && p.attributes.parent){
                    var pp = territories.getFeatureById(p.attributes.parent);
                    if(pp){
                        feature = pp;
                        selectControl.feature = feature;
                    }
                }
            }
        }
    }

    if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){

        selectedFeature = feature;
        feature.attributes.selected = true;
        territories.redraw();
        if(editAttributes == true){
            var info = $("#edit form .info");

            ensurePoints(selectedFeature);

            var collection = selectedFeature.attributes;
            info.append(getConfig(collection));
            info.append("<div class='pre'>Edit shape</div>");
            info.append('<input checked="true" name="geometry" type="radio" value="no">');
            info.append("<label>False</label>");
            info.append('<input  name="geometry" type="radio" value="shape">');
            info.append("<label>Shape</label>");
            info.append('<input  name="geometry" type="radio" value="position">');
            info.append("<label>Position</label>");
            var i = $("#edit .info input[name='army']"), a = i.val();
            if(a != null){i.replaceWith("<select name='army'>" + $(map.armies)
                                .map(function(){return "<option" + (this.name == a ? " selected='true'" :"") +" value='" + this.name +"'>" + this.name + "</option>";})
                                .toArray().reduce(function(a,b){return a + b;}) + "</select>");}

            $("#edit form input[type='submit']").toggleClass('hidden', false);

        }
        if(editGeometry == true){
            if(mf.feature){
                mf.unselectFeature();
            }
            mf.selectFeature(selectedFeature);
        }
    }
}

function onFeatureUnselect(feature) {

    if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"
      && feature.attributes.parent){
        if(feature.attributes.parent.CLASS_NAME == "OpenLayers.Feature.Vector"){
            feature = feature.attributes.parent;
            selectControl.feature = feature;
        }else{
            if(typeof(feature.attributes.parent) == "string"){
                var p = territories.getFeatureById(feature.attributes.parent);
                if(p && p.attributes.parent){
                    var pp = territories.getFeatureById(p.attributes.parent);
                    if(pp){
                        feature = pp;
                        selectControl.feature = feature;
                    }
                }
            }
        }
    }

    if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
        dc.deactivate();
        dragFeature = null;
        feature.attributes.selected = false;
        territories.redraw();
        if(editAttributes == true){
            $("#edit form .info").children().remove();
            $("#edit form input[type='submit']").toggleClass('hidden', true);
        }
        if(editGeometry == true){
            if(mf.feature){
                mf.unselectFeature();
            }

        }
    }
    showGrid();
}

var dragComplete = function(feature, pixel){
    if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"){
        if($("input[name='" + feature.attributes.type + ".id']").attr("value") ==  feature.geometry.id){
            feature.attributes.parent.attributes[feature.attributes.type].position = feature.geometry;
            $("input[name='" + feature.attributes.type + ".position']").attr("value", feature.geometry);
        }
    }
};


var dragStart = function(feature){
    if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"){
        if($("input[name='" + feature.attributes.type + ".id']").attr("value") ==  feature.geometry.id){
            if($("#edit form input[type='checkbox']:checked").closest(".m").find("input[name$='.id']").attr("value")
              == feature.geometry.id){
                  return true;
              }else{
                  dc.handlers.drag.deactivate();
                  return false;
              }
        }else{
            dc.handlers.drag.deactivate();
            return false;
        }
    }else{
        dc.handlers.drag.deactivate();
        return false;
    }
};

var geojson = new OpenLayers.Format.GeoJSON();

$("#maps a").live("click", function(){
    getMap($(this).text());
    updateWCP();
});

var highlightTerritory = function(text){
    $(territories.features).each(function(){
        if((text != "" && text != " " ) && this.attributes.map &&
           this.attributes.map.toLowerCase().indexOf(text.toLowerCase()) != -1){
            this.attributes.search = true;
        }else{
            this.attributes.search = false;
        }
    });
    territories.redraw();
};

$("#sidebar > div a:first-child").live("click", function(){
    $('#sidebar .selected').toggleClass('selected');
    $(this).parent().toggleClass('selected');
});


$("#sidebar .m label:first-child").live("click", function(){
    $(this).parent().toggleClass('show');
});

$("#search form").live("submit", function(){
    try{
        highlightTerritory($("#mapSearch").val());
    }
    catch(e){
    }
    return false;
});


$("#search form input[type='reset']").live("click", function(){ highlightTerritory("");});

$("#attack form").live("submit", function(){ var from = $("#attack #from").val();
                                             var to = $("#attack #target").val();
                                             var d = $("#attack #divitions").val();
                                             try{
                                                 attack(from,to,d);
                                             }
                                             catch(e){
                                             }
                                             return false;
                                           });

$("#attack a.attack").live("click", function(){

    var wrapper = $(this).parent().find("form span.wrapper").first();
    if(wrapper.children().length > 0){
        wrapper.children().remove();
    }
    wrapper.append("<label>target</label>"+
               "<select id='target'>"+
               filterTerritory("army", map.attackingarmy, true)
               .map(function(){return this.attributes.name;})
               .sort()
               .map(function(){return "<option value='" + this +"'>" + this + "</option>"})
               .toArray().reduce(function(a,b){return a + b;}) +
               "</select>"+
               "<div class='from'>" +
               "<label>from</label>"+
               "<select id='from'>"+
               filterTerritory("army", map.attackingarmy, false)
               .map(function(){return this.attributes.name;})
               .sort()
               .map(function(){return "<option value='" + this +"'>" + this + "</option>"})
               .toArray().reduce(function(a,b){return a + b;}) +
                "</select>" +
               "<label>divitions</label>"+
               "<input id='divitions' type='text' />" +
               "</div>");
    return false;
});

$("#attack input[type='reset']").live("click", function(){ cancelAttack();});

$("#sidebar #edit input[type='radio']").live("click", function(){
    var selected = $("#sidebar #edit :checked").attr('value');
    if(selected == "territory"){
        selectControl.activate();
        editAttributes = true;
    }else{
        selectControl.unselectAll();
        selectControl.deactivate();
        editAttributes = false;
        editGeometry = false;
    }
    if(selected == "mapsettings"){
        $("#edit .map,#edit #update").toggle(true);
        var i = $("input[name='attackingarmy']"), a = i.val();
        if(a){i.replaceWith("<select name='attackingarmy'>" + $(map.armies)
                            .map(function(){return "<option" + (this.name == a ? " selected='true'" :"") +" value='" + this.name +"'>" + this.name + "</option>";})
                            .toArray().reduce(function(a,b){return a + b;}) + "</select>");}
    }else{
        $("#edit .map,#edit #update").toggle(false);
    }

});

$("#edit form").live("submit", function(){
    var selected = $("#sidebar #edit :checked").attr('value');
    if(selected == "territory"){
        updateTerritory();
        var f = selectedFeature;
        if(f){
            try{
                onFeatureUnselect(selectedFeature);
                onFeatureSelect(selectedFeature);
                }
            catch(e){
            }
        }
    }
    if(selected == "mapsettings"){
            updateMap(getMapInfo());
    }
    return false;
});

$("#edit form input.possitionEdit").live("click", function(){
    var id = $(this).closest(".m").find(".positionId").attr("value");
    var f = $(territories.features).filter(function(){return this.geometry.id == id;})[0];

    if($(this).closest(".m").find("input[name$='available']").attr("value") != "false"){
        var that = this;
        $("#edit form input[type='checkbox']:checked")
            .filter(function(i,e){return e != that;})
            .each(function(){$(this).attr("checked", false);});
        if($(this).attr("checked")){
            dragFeature = f;
            dc.activate();
            territories.redraw();
        }else{
            dc.deactivate();
            dragFeature = null;
        }
        return true;
    }else{
        return false;
    }
});

$("#edit form input[name='geometry']").live("click", function(){
    var edit = $(this).attr('value');

    mf.unselectFeature();

    if(edit != "no"){
        if(edit == "shape"){
            mf.mode = 1;
        }
        if(edit == "position"){
            mf.mode = 8;
        }
        editGeometry = true;
        mf.selectFeature(selectedFeature);
    }else{
           editGeometry = false;
    }
});

$("#saveform form").live("submit", function(){
    try{
        var m = getMapInfo();
        updateMap(m);
        m.password = $("#password").val();
        m.newmap = geojson.write($(territories.features)
                                 .filter(function(){return this.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon";})
                                 .toArray());
        $.post("http://" + window.location.host + "/save",
               m,
               function(d,s){
                   var data = $.parseJSON(d);
                   if(data.message == "map saved"){
                       $("#maps").prepend("<a href='#'>" + data.name + "</a>");
                   }
                   else{

                   }
           });
    }catch(ex){}
    return false;
});

$("#edit #update").live("click", function(){
    updateMap(getMapInfo());
    return false;
});

$("#edit .map input[type='text']").live("keypress", function(event) {
  if ( event.which == 13 ) {
      updateMap(getMapInfo());
      return false;
  }else{
    return true;
  }
});

var updateMapSize = function(){
  $("#map").height($(window).height()*0.9);
  $("#map").width(($(window).width()*0.95) - 250);
};

$("input.hex").live("blur", function(event) {
    $("div.picker-on").removeClass("picker-on");
    $("#picker").remove();
    $("input.focus, select.focus").removeClass("focus");
});


var showColorPickerBg = function(){
    $("input.hex").each(function() {
        $("<div/>").farbtastic(this).remove();
    });
};

$("input.hex")
    .live("click", function(event) {
        $(this).addClass("focus");
        $("#picker").remove();
        $("div.picker-on").removeClass("picker-on");
        $("div.texturePicker ul:visible").hide(0).parent().css("position", "static");
        $(this).after("<div id=\"picker\"></div>").parent().addClass("picker-on");
        $("#picker").farbtastic(this);
        event.preventDefault();
    });


$(document).ready(  function (){

    $("#edit form input[type='submit']").toggleClass('hidden', true);
    updateMapSize();
    $(window).resize(updateMapSize);
    map = new OpenLayers.Map('map');

    var basemap = new OpenLayers.Layer.Image(
        'map',
        'img/map-connections.jpg',
        new OpenLayers.Bounds(-180,-88.759,180,102),
        new OpenLayers.Size(1920 / 2, 860 / 2 ),
        {numZoomLevels: 3}
    );

    map.armies = [{name: "LOD", fillColor:'#550000', strokeColor:'#990000', selectedFillColor: '#EE0000', attackColor: "#DD0000",
                   externalGraphic: {hq: "img/hq2.png", aa: "img/aa2.png", ab: "img/ab2.png", fob: "img/fob2.png", bigSize: 45, size: 35, smallSize: 20}},
                  {name: "KART", fillColor:'#000055', strokeColor:'#000099', selectedFillColor: '#0000EE', attackColor: "#0044EE",
                   externalGraphic: {hq: "img/hq.png", aa: "img/aa.png", ab: "img/ab.png", fob: "img/fob.png", bigSize: 45, size: 35, smallSize: 20}},
                  {name: "", fillColor:'#eeeeee', strokeColor:'#ffffff', selectedFillColor: '#cccccc', attackColor: "#333333",
                   externalGraphic: {hq: "img/hq.png", aa: "img/aa.png", ab: "img/ab.png", fob: "img/fob.png", bigSize: 45, size: 35, smallSize: 20}}];

   var style = new OpenLayers.Style({
            strokeOpacity: 1,
            strokeWidth: 3,
            fillOpacity: "${getFillOpacity}",
            pointRadius: "${getPointRadius}",
            pointerEvents: "visiblePainted",
            // label with \n linebreaks
            label : "${getLabel}",
            fontColor: "white",
            fontSize: "12px",
            fontFamily: "Courier New, monospace",
            labelOutlineColor: "black",
            labelOutlineWidth: 1
        }, {context: {
              getLabel: function(feature,x,y){
                  var res = "";
                  if(feature.geometry && feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"){
                      if(feature.attributes && feature.attributes.type && feature.attributes.type == "divitions"){
                          res = feature.attributes.available;
                      }
                      if(feature.attributes && feature.attributes.type && feature.attributes.type == "label"){
                          res = feature.attributes.parent.attributes.name + "\n\n" + feature.attributes.parent.attributes.map;
                      }
                  }
                  return res;
              },
            getExternalGraphic: function(feature){
                var res = (feature.attributes && feature.attributes.type &&
                           feature.attributes.type != "divitions" && feature.attributes.type != "label"
                           && trueish(feature.attributes.available)?
                           map.armies.filter(function(army){return army.name == feature.attributes.army;})[0]
                           .externalGraphic[feature.attributes.type] : "");
                return res;
            },
            getPointRadius: function(feature){
                var res = 6;

                if(feature.attributes && feature.attributes.type){
                    res = 0;

                    if(feature.attributes.type == "divitions"){
                        res = parseInt(feature.attributes.available) * 4 + 5;
                    }else{
                        if(trueish(feature.attributes.available)){
                            res = 50;

                            if(feature.attributes.type && feature.attributes.army){
                                var eg = map.armies.filter(function(army){return army.name == feature.attributes.army;})[0].externalGraphic;
                                if(map.getScale() < 35000000){
                                    res = eg.bigSize;
                                }else{
                                    if(map.getScale() > 130000000 ){
                                        res = eg.smallSize;
                                    }else{
                                        res = eg.size;
                                    }
                                }
                            }

                            if(feature.attributes.type == "label"){
                                if(feature == dragFeature){
                                    res = 6;
                                }else {
                                    res= 0;
                                }
                            }
                        }
                    }
                }
                return res;
            },
            getFillOpacity: function(feature){
                return (feature.attributes && feature.attributes.type && feature.geometry
                        && feature.geometry.id && feature.geometry.id.indexOf("Point") != -1? 1: 0.6);
            },
            getFillColor: function(feature){
                return map.armies.filter(function(army){return army.name == feature.attributes.army;})[0].fillColor;
            },
            getStrokeColor: function(feature){
                return map.armies.filter(function(army){return army.name == feature.attributes.army;})[0].strokeColor;
            },
            getSelectedFillColor: function(feature){
                return map.armies.filter(function(army){return army.name == feature.attributes.army;})[0].selectedFillColor;
            }
        },
            rules: [
                new OpenLayers.Rule({
                    minScaleDenominator: 96000000,
                    symbolizer: {
                        fontSize: "9px"
                    }
                }),
                     new OpenLayers.Rule({
                       maxScaleDenominator: 96000000,
                       symbolizer: {
                         fontSize: "12px"
                       }
                    }),
                     new OpenLayers.Rule({
                       filter: new OpenLayers.Filter.Logical({
                            filters: [
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: ""
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: null
                                })],
                           type: OpenLayers.Filter.Logical.OR
                       }),
                       symbolizer: {
                         fillColor:"#aaaaaa", strokeColor: "#cccccc"
                       }
                    }),
                     new OpenLayers.Rule({
                       filter: new OpenLayers.Filter.Comparison({
                         type: OpenLayers.Filter.Comparison.EQUAL_TO,
                         property: "army",
                         value: map.armies[0].name
                       }),
                       symbolizer: {
                         fillColor: "${getFillColor}", strokeColor: "${getStrokeColor}", externalGraphic: "${getExternalGraphic}"
                       }
                    }),
                    new OpenLayers.Rule({
                      filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "army",
                         value: map.armies[1].name
                       }),
                       symbolizer: {
                         fillColor:  "${getFillColor}", strokeColor:  "${getStrokeColor}", externalGraphic: "${getExternalGraphic}"
                       }
                    }),
                    new OpenLayers.Rule({
                      filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "army",
                         value: map.armies[2].name
                       }),
                       symbolizer: {
                         fillColor:  "${getFillColor}", strokeColor:  "${getStrokeColor}", externalGraphic: "${getExternalGraphic}"
                       }
                    }),
                new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Logical({
                            filters: [
                                new OpenLayers.Filter.Logical({
                                    filters: [
                                        new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "search",
                                            value: true
                                        }),new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "underAttackAnnimation",
                                            value: true
                                        }),new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "selected",
                                            value: true
                                        })],
                                    type: OpenLayers.Filter.Logical.OR
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: map.armies[0].name
                                })],
                            type: OpenLayers.Filter.Logical.AND
                        }),
                        symbolizer: {
                            fillColor: "${getSelectedFillColor}",
                            graphicZIndex: 999
                        }
                    }),
                new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Logical({
                            filters: [
                                new OpenLayers.Filter.Logical({
                                    filters: [
                                        new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "search",
                                            value: true
                                        }),new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "underAttackAnnimation",
                                            value: true
                                        }),new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "selected",
                                            value: true
                                        })],
                                    type: OpenLayers.Filter.Logical.OR
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: map.armies[1].name
                                })],
                            type: OpenLayers.Filter.Logical.AND
                        }),
                        symbolizer: {
                            fillColor: "${getSelectedFillColor}",
                            graphicZIndex: 999
                        }
                    }),
                new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Logical({
                            filters: [
                                new OpenLayers.Filter.Logical({
                                    filters: [
                                        new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "search",
                                            value: true
                                        }),new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "underAttackAnnimation",
                                            value: true
                                        }),new OpenLayers.Filter.Comparison({
                                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                            property: "selected",
                                            value: true
                                        })],
                                    type: OpenLayers.Filter.Logical.OR
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: map.armies[2].name
                                })],
                            type: OpenLayers.Filter.Logical.AND
                        }),
                        symbolizer: {
                            fillColor: "${getSelectedFillColor}",
                            graphicZIndex: 999
                        }
                    })
                  ]
           }
    );

    var selectedStyle = style.clone();
    selectedStyle.defaultStyle.graphicZIndex = 9999999;
    selectedStyle.isDefault = false;

    style.isDefault = true;

    territories = new OpenLayers.Layer.Vector("Territories", {
        styleMap: new OpenLayers.StyleMap({"default": style, "select": selectedStyle}),
        rendererOptions: {yOrdering: false},
        eventListeners: { "moveend" : showGrid}
    });

    updateMap = function(data){

        $("h3").text(data.name);
        map.baseLayer.url =  data['bgurl'];
        map.baseLayer.extent = new OpenLayers.Bounds.fromString(data['bgbounds']);
        if(typeof(data['armies']) == "string"){
            data['armies'] = JSON.parse(data['armies']);
        }
        map.armies = values(data.armies);
        map.baseLayer.redraw();
        map.attackingarmy = data.attackingarmy;
        territories.redraw();
        makeGridPattern();
        showGrid();
        if(!selectControl.active){
            //no idea why, but with out this the svg patterns will not update
            selectControl.activate();
            selectControl.deactivate();
        }
    };


    getMap = function(name){
        $.get("http://" + window.location.host + "/map/" +  name, function(data){ loadMap(data);});
    };

    loadMap = function(data){
        if(data['bgurl'] == null){
            data['bgurl'] = map.baseLayer.url;
        }
        if(data['bgbounds'] == null){
            data['bgbounds'] = map.baseLayer.extent.toBBOX();
        }
        if(data['armies'] == null){
            data['armies'] = map.armies;
        }else{
            for(var k in data['armies']){
                if(!data['armies'][k].externalGraphic){
                    data['armies'][k].externalGraphic = map.armies[k].externalGraphic;
                }
            }
        }
        if(data['attackingarmy'] == null){
            data['attackingarmy'] = data.armies[0].name;
        }
        map.attackingarmy = data.attackingarmy;
        updateMap(data);
        $("#edit .map").children().remove();
        $("#edit .map").append(getConfig(data, ["features", "type", "password"]));
        showColorPickerBg();
        territories.removeAllFeatures();
        territories.addFeatures(geojson.read(data));
        $(territories.features).each(function(){ensurePoints(this); updatePoints(this);});
        updateWCP();

        $("#map svg").first().svg()
        svgw = $("#map svg").first().svg("get");

        makeGridPattern();
        showGrid();
    };

    OpenLayers.Renderer.symbol.arrow = [0,2, 1,0, 2,2, 1,0, 0,2];
    features = new OpenLayers.Layer.Vector("Features", {
        styleMap: new OpenLayers.StyleMap(new OpenLayers.Style({
            strokeOpacity: 1,
            strokeWidth: 6,
            strokeColor: "#000000",
            pointRadius: 6,
            fontColor: "white",
            fontSize: "16px",
            fontFamily: "Courier New, monospace",
            labelOutlineColor: "black",
            labelOutlineWidth: 1,
            graphicZIndex: 99999
        }, { context: {
            getAttackColor: function(feature){
                return map.armies.filter(function(army){return army.name == feature.attributes.army;})[0].attackColor;
            }
        },
        rules: [
            new OpenLayers.Rule({
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "showlabel",
                    value: true
                }),
                symbolizer: {
                    label : "${divitions}",
                    pointRadius: 0
                            }
            }),
            new OpenLayers.Rule({
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "arrow",
                    value: true
                }),
                symbolizer: {
                    graphicName:"arrow",
                    rotation : "${angle}",
                    strokeWidth: "8"
                            }
            }),
            new OpenLayers.Rule({
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "army",
                    value: map.armies[0].name
                }),
                symbolizer: {strokeColor: map.armies[0].attackColor
                            }
            }),
            new OpenLayers.Rule({
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "army",
                    value:  map.armies[1].name
                }),
                symbolizer: { strokeColor: map.armies[1].attackColor
                            }
            })
        ]})),
        rendererOptions: {yOrdering: false}
    });

    getMap("latest");

    map.addLayers([basemap, territories, features]);
    features.setVisibility(false);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.zoomTo(1);

    selectControl = new OpenLayers.Control.SelectFeature([territories, features], {hover:false,box:false,onSelect: onFeatureSelect, onUnselect: onFeatureUnselect});
    map.addControl(selectControl);
    selectControl.deactivate();

    mf = new OpenLayers.Control.ModifyFeature(territories, {standalone : true});
    map.addControl(mf);
    mf.activate();


    dc = new OpenLayers.Control.DragFeature(territories, {onComplete: dragComplete, onEnter: dragStart,
                                                          geometryTypes: ["OpenLayers.Geometry.Point"]});
    map.addControl(dc);
    dc.deactivate();

   updateWCP();

}
);

var getTerritory = function(name){
    if(name == null || name == ""){
        return false;
    }else{
        return $(territories.features).filter(function(){ return this.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"
                                                          && this.attributes.name.toLowerCase().indexOf(name.toLowerCase()) != -1; })[0];
    }
}


var attackTimer;

function startAttackAnimation() {
    if (!attackTimer) {
        var f = function(){
            $(territories.features).filter(function(){ return this.attributes.underAttack == true; })
                .each(function(){
                    var thatFeature = this;
                    var svgFeature = $("#map path").filter(function(){return this.id == thatFeature.geometry.id;});
                    var army = map.armies.filter(function(army){return army.name == thatFeature.attributes.army;})[0];
                    svgFeature.animate({svgFill: army.attackColor}, 2000);
                    svgFeature.animate({svgFill: army.fillColor}, 2000);
                });
            features.setVisibility(true);
        };
        f();
        attackTimer = window.setInterval(f, 4000);
    }
}

function stopAttackAnimation() {
    window.clearInterval(attackTimer);
    attackTimer = null;
    features.display(false);
}

var cancelAttack = function(){
    stopAttackAnimation();
    filterTerritory("underAttack", true).each(function(){this.attributes.underAttack = false; if(this.stop){this.stop(true,true);}});
    territories.redraw();
    features.removeAllFeatures();
}


var attack = function (from, to, divitions){

    try{

        var t1 = getTerritory(from);

        if(divitions + 1 <=  t1.attributes.divitions.available){
            var t2 = getTerritory(to);
            var p1 = t1.geometry.getCentroid();
            var p2 = t2.geometry.getCentroid();
            p2 = getPointOnLine(new OpenLayers.Geometry.LineString([p1,p2]),0.75).geometry;
            var ls = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([p1,p2]));
            var cp = getPointOnLine(ls.geometry, 0.5);

            t2.attributes.underAttack = true;
            ls.attributes.army = t1.attributes.army;

            features.addFeatures([ls, cp]);

            var ep1 = createDirection(ls.geometry,"end",false)[0];
            ep1.attributes.army = t1.attributes.army;
            ep1.attributes.arrow = true;

            var ep2 = createDirection(ls.geometry,"middle",false)[0];
            ep2.attributes.divitions = divitions;
            ep2.attributes.showlabel = true;
            features.addFeatures([ep1, ep2]);

            features.display(true);
            startAttackAnimation();
        }
    }catch(ex){
    }
};


var grid = null;

var makeGridPattern = function(){


    if(!svgw){
        svgw = $("#map svg").first().svg("get");
    }
    if(svgw){

        $(map.armies).each(function(){

            grid = assocIn(grid, [this.name, "default"], svgw.pattern($("#map svg").first(), "grid" + this.name + "default", 0,
                                                                    0, 20, 20,
                                                                    0, 0, 40, 40, {patternUnits: "userSpaceOnUse"}));

            svgw.rect(grid[this.name].default,0,0,40,40,0,0,{fill: this.fillColor, opacity: 1});
            var path = svgw.createPath();
            svgw.path(grid[this.name].default, path.move(0, 0).line([[0,750]]).close(),{stroke: "#444444", strokeWidth: 10, opacity: 1});
            svgw.path(grid[this.name].default, path.move(0, 0).line([[750,0]]).close(),{stroke: "#444444", strokeWidth: 10, opacity: 1});

            grid = assocIn(grid, [this.name, "selected"], svgw.pattern($("#map svg").first(), "grid" + this.name + "selected", 0,
                                                                     0, 20, 20,
                                                                     0, 0, 40, 40, {patternUnits: "userSpaceOnUse"}));

            svgw.rect(grid[this.name].selected,0,0,40,40,0,0,{fill: this.selectedFillColor, opacity: 1});
            var path = svgw.createPath();
            svgw.path(grid[this.name].selected, path.move(0, 0).line([[0,750]]).close(),{stroke: "#444444", strokeWidth: 10, opacity: 1});
            svgw.path(grid[this.name].selected, path.move(0, 0).line([[750,0]]).close(),{stroke: "#444444", strokeWidth: 10, opacity: 1});
        });
    }
};

var showGrid = function (options){

    if(!svgw){
        svgw = $("#map svg").first().svg("get");
    }
    if(svgw){

        if(!grid){
            makeGridPattern();
        }
        if(grid){
            $(getTerritory("germ")).each(function(){
                var t = this;
                var army = map.armies.filter(function(army){return army.name == t.attributes.army;})[0];
                var path = $("#map path").filter(function(){return this.id == t.geometry.id;}).first();

                var g = (t.attributes && t.attributes.selected && t.attributes.selected == true? grid[army.name].selected : grid[army.name].default);
                $(path).attr("fill","url(#" + g.id + ")");
            });
        }
    }
};
