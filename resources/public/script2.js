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
var filterTerritory = function(key, value){return  $(map.layers[1].features).filter(function(){return this.attributes[key] == value;});};

var getInfo = function(parent){
    var m = {};
    $(parent).each(function(){
        assocIn(m, this.name.split("."), this.value);
    });
    return m;
};


var getMapInfo = function(){
    return getInfo("#edit .map input");
};

var updatePoints = function(feature){
    for (var key in feature.attributes){
        if (feature.attributes.hasOwnProperty(key)) {
            var value = feature.attributes[key];
            if(value.position){
                $(territories.features).filter(function(){return this.geometry.id == value.id;}).each(function(){this.destroy();});

                var point;

                if(typeof(value.position) == "string"){
                    var p = new OpenLayers.Geometry.fromWKT(value.position);
                    p.id = value.id;
                    point= new OpenLayers.Feature.Vector(p);
                }else{
                    point= new OpenLayers.Feature.Vector(value.position);
                }
                point.attributes = assocIn(point.attributes, ["type"], key);
                point.attributes = assocIn(point.attributes, ["army"], feature.attributes.army);
                point.attributes = assocIn(point.attributes, ["available"], feature.attributes[key].available);
                point.attributes = assocIn(point.attributes, ["parent"], feature);
                territories.addFeatures([point]);
            }
        }
    };
};


var updateTerritory = function(){
    selectedFeature.attributes = getInfo("#edit .info span input");
    updateWCP();
    updatePoints(selectedFeature);
    territories.redraw();
};

var updateWCP  = function(){
    if(territories.features.length > 0){
        var territoryCount = function(army){return $(filterTerritory("army",army))
                                            .filter(function(){return this.geometry &&
                                                               this.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon";}).length;};
        var divitionCount = function(army){
                                       var terrs = $.map(filterTerritory('army',army), function(t){var d = (t.attributes && t.attributes.divitions?
                                                                                                            t.attributes.divitions.available : 0);
                                                                                                  return (isNumber(d)? parseInt(d) : 0);});
                                       return terrs.reduce(function(a,b){return a + b;});
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

        var st = territoryCount("star");
        var gt = territoryCount("gld");
        var tt = gt + st;
        var gcp = getArmyCPs("gld");
        var scp = getArmyCPs("star");
        var twcp = gcp + scp;
        $("#wcp .a1").text( "STAR territory: " + (st / tt * 100 ).toFixed(2) + "% wcp: " + (scp / twcp * 100 ).toFixed(2) + "% divitions: " + divitionCount("star"));
        $("#wcp .a2").text(  "GLD territory: " + (gt / tt * 100 ).toFixed(2) + "% wcp: " + (gcp / twcp * 100 ).toFixed(2) + "% divitions: " + divitionCount("gld"));
    }

}

var map, selectControl, selectedFeature,updateMap, loadMap, getMap, territories, featuresm, mf;
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
                            (key == "position"? "<input name='edit' type='checkbox' class='possitionEdit' />"
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

var defaultpositionKeys = ["hq", "aa", "ab", "fob", "divitions"];

var ensurePoints = function(feature, ks){
    if(ks == null){
        ks = defaultpositionKeys;
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
        }
    }
    return feature;
};

function onPopupClose(evt) {
    selectControl.unselect(selectedFeature);
}
function onFeatureSelect(feature) {

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
    if(mf.feature && mf.feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"){
        var f = mf.feature;
        var p = f.attributes.parent;
        p.attributes[mf.feature.attributes.type].position = f.geometry;
        mf.unselectFeature();

        $(".possitionEdit:checked").attr("checked", false);

        onFeatureUnselect(p);
        editAttributes = true;
        p.attributes.selected = true;
        selectControl.select(p);
    }
    else{
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
}

var geojson = new OpenLayers.Format.GeoJSON();

$("#maps a").live("click", function(){
    getMap($(this).text());
    updateWCP();
});

var highlightTerritory = function(text){
    $(territories.features).each(function(){
        if((text != "" && text != " " ) && this.attributes.map.toLowerCase().indexOf(text.toLowerCase()) != -1){
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

$("#search form").live("submit", function(){ highlightTerritory($("#mapSearch").val()); return false;});

$("#search form input[type='reset']").live("click", function(){ highlightTerritory("");});

$("#attack form").live("submit", function(){ var from = $("#attack #from").val();
                                             var to = $("#attack #to").val();
                                             var d = $("#attack #divitions").val();
                                             attack(from,to,d);
                                             return false;
                                           });


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
        if(mf.feature){
            if(mf.feature.geometry.id == id){
                onFeatureUnselect(f);
                return true;
            }
            return false;
        }else{
        mf.selectFeature(f);
            return true;
        }
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
    var m = getMapInfo();
    updateMap(m);
    m.password = $("#password").val();
    m.newmap = geojson.write(territories.features);
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
    return false;
});

$("#edit #update").live("click", function(){
    updateMap(getMapInfo());
    return false;
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

    map.armies = [{name: "star", fillColor:'#550000', strokeColor:'#990000', selectedFillColor: '#EE0000', attackColor: "#DD0000",
                   externalGraphic: {hq: "img/hq2.png", aa: "img/aa2.png", ab: "img/ab2.png", fob: "img/fob2.png"}},
                  {name: "gld", fillColor:'#000055', strokeColor:'#000099', selectedFillColor: '#0000EE', attackColor: "#0044EE",
                   externalGraphic: {hq: "img/hq.png", aa: "img/aa.png", ab: "img/ab.png", fob: "img/fob.png"}}];

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
            labelXOffset: "${xOffset}",
            labelYOffset: "${yOffset}",
            labelOutlineColor: "black",
            labelOutlineWidth: 1
        }, {context: {
              getLabel: function(feature,x,y){
                  var res = "";
                  if(feature.geometry && feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                      res = "${name}\n\n${map}";
                  }else{
                      if(feature.geometry && feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point"){
                          if(feature.attributes && feature.attributes.type && feature.attributes.type == "divitions"){
                              res = feature.attributes.available;
                          }
                      }
                  }
                  return res;
              },
            getExternalGraphic: function(feature){
                var res = (feature.attributes && feature.attributes.type &&
                           feature.attributes.type != "divitions" && trueish(feature.attributes.available)?
                           map.armies.filter(function(army){return army.name == feature.attributes.army;})[0]
                           .externalGraphic[feature.attributes.type] : "");
                return res;
            },
            getPointRadius: function(feature){
                return (feature.attributes && feature.attributes.type?
                        (feature.attributes.type == "divitions"? parseInt(feature.attributes.available) * 4 + 5 :
                        (trueish(feature.attributes.available)? 50 : 0 )): 6);
            },
            getFillOpacity: function(feature){
                return (feature.attributes && feature.attributes.type && feature.geometry && feature.geometry.id.indexOf("Point") != -1? 1: 0.6);
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
        rendererOptions: {yOrdering: false}
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
        territories.redraw();
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
        updateMap(data);
        $("#edit .map").children().remove();
        $("#edit .map").append(getConfig(data, ["features", "type", "password"]));
        showColorPickerBg();
        territories.removeAllFeatures();
        territories.addFeatures(geojson.read(data));
        $(territories.features).each(function(){ensurePoints(this); updatePoints(this);});
        updateWCP();
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

   updateWCP();

}
);

var getTerritory = function(name){
    if(name == null || name == ""){
        return false;
    }else{
        return $(territories.features).filter(function(){ return this.attributes.name.toLowerCase().indexOf(name.toLowerCase()) != -1; })[0];
    }
}


var attackTimer;

function startAttackAnimation() {
    if (!attackTimer) {
        var f = function(){
            $(territories.features).filter(function(){ return this.attributes.underAttack == true; })
                .each(function(){this.attributes.underAttackAnnimation = !trueish(this.attributes.underAttackAnnimation);});
            territories.redraw();
            features.setVisibility(true);
        };
        f();
        attackTimer = window.setInterval(f, 1 * 1000);
    }
}

function stopAttackAnimation() {
    window.clearInterval(attackTimer);
    attackTimer = null;
    features.display(false);
}


var attack = function (from, to, divitions){

    try{

        var t1 = getTerritory(from);

        if(divitions + 1 <=  t1.attributes.divitions){
            var t2 = getTerritory(to);
            var p1 = t1.geometry.getCentroid();
            var p2 = t2.geometry.getCentroid();
            p2 = getPointOnLine(new OpenLayers.Geometry.LineString([p1,p2]),0.75).geometry;
            var ls = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([p1,p2]));
            var cp = getPointOnLine(ls.geometry, 0.5);

            t1.attributes.divitions = t1.attributes.divitions - divitions;
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

            startAttackAnimation();
        }
    }catch(ex){
    }
};
