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
var trueish = function(s){
  return s != null && ( s == true || (typeof(s) == "string" && ( s.toLowerCase()  == "true" || s.toLowerCase() == "yes" || s == "1")));
}

var theaters = {'australia': 2, 'south america' : 2, 'middle east' : 3, 'africa' : 4, 'north america' : 5, 'europe' : 6, 'asia' : 6};
var filterTerritory = function(key, value){return  $(map.layers[1].features).filter(function(){return this.attributes[key] == value})};

var updateTerritory = function(){
  selectedFeature.attributes.name = $("#territory input[name='name']").val();
  selectedFeature.attributes.theater = $("#territory input[name='theater']").val();
  selectedFeature.attributes.map = $("#territory input[name='map']").val();
  selectedFeature.attributes.army = $("#territory input[name='army']").val();
  selectedFeature.attributes.divitions = $("#territory input[name='divitions']").val();
  selectedFeature.attributes.hq = $("#territory input[name='hq']").val();
  selectedFeature.attributes.ab = $("#territory input[name='ab']").val();
  selectedFeature.attributes.aa = $("#territory input[name='aa']").val();
  selectedFeature.attributes.fob = $("#territory input[name='fob']").val();
  selectedFeature.attributes.xOffset = $("#territory input[name='xOffset']").val();
  selectedFeature.attributes.yOffset = $("#territory input[name='yOffset']").val();
  if(selectedFeature.attributes.xOffset ==  null || selectedFeature.attributes.xOffset == ""){ selectedFeature.attributes.xOffset = "0";}
  if(selectedFeature.attributes.yOffset ==  null || selectedFeature.attributes.yOffset == ""){ selectedFeature.attributes.yOffset = "0";}
  updateWCP();
};

var updateWCP  = function(){
    if(territories.features.length > 0){
        var territoryCount = function(army){return filterTerritory("army",army).length;};
        var divitionCount = function(army){
                                       var terrs = $.map(filterTerritory('army',army), function(t){return t.attributes.divitions - 0;});
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

var map, selectControl, selectedFeature, loadMap, getMap, territories, features;
function onPopupClose(evt) {
    selectControl.unselect(selectedFeature);
}
function onFeatureSelect(feature) {
    selectedFeature = feature;
    popup = new OpenLayers.Popup.FramedCloud("territory",
                             feature.geometry.getBounds().getCenterLonLat(),
                             null,
                             "<form>"+
                             "<span>"+
                             "<label>territory name</label>"+
                             "<input type='text' name='name' value='"+ feature.attributes.name +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>theater</label>"+
                             "<input type='text' name='theater' value='"+ feature.attributes.theater +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>bf3 map</label>"+
                             "<input type='text' name='map' value='"+ feature.attributes.map +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>controlling army</label>"+
                             "<input type='text' name='army' value='"+ feature.attributes.army +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>nr of divitions</label>"+
                             "<input type='text' name='divitions' value='"+ feature.attributes.divitions +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>HQ</label>"+
                             "<input type='text' name='hq' value='"+ feature.attributes.hq +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>Air base</label>"+
                             "<input type='text' name='ab' value='"+ feature.attributes.ab +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>Anti air</label>"+
                             "<input type='text' name='aa' value='"+ feature.attributes.aa +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>Forward operating base</label>"+
                             "<input type='text' name='fob' value='"+ feature.attributes.fob +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>Label offset N-S</label>"+
                             "<input type='text' name='yOffset' value='"+ feature.attributes.yOffset +"' />" +
                             "</span>"+
                             "<span>"+
                             "<label>Label offset E-W</label>"+
                             "<input type='text' name='xOffset' value='"+ feature.attributes.xOffset +"' />" +
                             "</span>"+
                             "<input type='button' name='save' value='save' onClick='updateTerritory()'/>" +
                             "<span class='clear'></span>"+
                             "</form>",
                             null, true, onPopupClose);
    feature.popup = popup;
    map.addPopup(popup);
}
function onFeatureUnselect(feature) {
    map.removePopup(feature.popup);
    feature.popup.destroy();
    feature.popup = null;
}
var geojson = new OpenLayers.Format.GeoJSON();

$("#save").live("click", function(){
    $("#saveform").toggle();
});


$("#tools .attack").live("click", function(){
    $("#attack").toggle();
});

$("#saveform a").live("click", function(){
    var n = $("#name").val();
    var p = $("#password").val();
    var f = geojson.write(territories.features);
    $.post("http://" + window.location.host + "/save",
           {"name" : n, "password" : p, "newmap" : f},
           function(){});

    $(this).closest(".popup").toggle();
    return false;
});

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

$("#search form").live("submit", function(){ highlightTerritory($("#mapSearch").val()); return false;});

$("#attack form").live("submit", function(){ var from = $("#attack #from").val();
                                             var to = $("#attack #to").val();
                                             var d = $("#attack #divitions").val();
                                             attack(from,to,d);
                                             $(this).closest(".popup").toggle();
                                             return false;
                                           });

$(document).ready(  function (){
  $("#map").height($(document).height()*0.9);
  $("#map").width($(document).width()*0.95);
    map = new OpenLayers.Map('map');

    var basemap = new OpenLayers.Layer.Image(
        'map',
        'img/map-connections.jpg',
        new OpenLayers.Bounds(-180, -88.759, 180, 88.759),
        new OpenLayers.Size(1920, 860 ),
        {numZoomLevels: 3}
    );

   var style = new OpenLayers.Style({
            strokeOpacity: 1,
            strokeWidth: 3,
            fillOpacity: 0.6,
            pointRadius: 6,
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
              getLabel: function(feature){
                  var res = "${name}\n\n${map}\n\ndivs: ${divitions}";
                  if(trueish(feature.attributes.hq)){
                  res += ", HQ";
                  }
                  if(trueish(feature.attributes.ab)){
                      res += ", AB";
                  }
                  if(trueish(feature.attributes.aa)){
                      res += ", AA";
                  }
                  if(trueish(feature.attributes.fob)){
                      res += ", FOB";
                  }

                  return res;
              },
            getColor: function(feature){

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
                         value: "star"
                       }),
                       symbolizer: {
                         fillColor: "#550000", strokeColor: "#990000"
                       }
                    }),
                    new OpenLayers.Rule({
                      filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "army",
                        value: "gld"
                      }),
                       symbolizer: {
                         fillColor: "#000055", strokeColor: "#000099"
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
                                        })],
                                    type: OpenLayers.Filter.Logical.OR
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: "star"
                                })],
                            type: OpenLayers.Filter.Logical.AND
                        }),
                        symbolizer: {
                            fillColor: "#EE0000",
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
                                        })],
                                    type: OpenLayers.Filter.Logical.OR
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                                    property: "army",
                                    value: "gld"
                                })],
                            type: OpenLayers.Filter.Logical.AND
                        }),
                        symbolizer: {
                            fillColor: "#0000EE",
                            graphicZIndex: 999
                        }
                    })
                  ]
           }
    );

    territories = new OpenLayers.Layer.Vector("Territories", {
        styleMap: new OpenLayers.StyleMap(style),
        rendererOptions: {yOrdering: true}
    });


    getMap = function(name){
        $.get("http://" + window.location.host + "/map/" +  name, function(data){ loadMap(data);});
    };

    loadMap = function(data){
        $("h3").text(data.name);
        territories.removeAllFeatures();
        territories.addFeatures(geojson.read(data));
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
            labelOutlineWidth: 1
        }, {
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
                    value: "star"
                }),
                symbolizer: {strokeColor: "#DD0000"
                            }
            }),
            new OpenLayers.Rule({
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "army",
                    value: "gld"
                }),
                symbolizer: { strokeColor: "#0044EE"
                            }
            })
        ]})),
        rendererOptions: {yOrdering: true}
    });

    getMap("latest");

   selectControl = new OpenLayers.Control.SelectFeature(territories, {hover:false,box:false,onSelect: onFeatureSelect, onUnselect: onFeatureUnselect});
   map.addControl(selectControl);
   selectControl.activate();

   map.addLayers([basemap, territories, features]);
   map.addControl(new OpenLayers.Control.LayerSwitcher());
   map.zoomToMaxExtent();
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
        };
        f();
        attackTimer = window.setInterval(f, 1 * 1000);
    }
}

function stopAttackAnimation() {
    window.clearInterval(attackTimer);
    attackTimer = null;
}


var attack = function (from, to, divitions){

    try{

        var t1 = getTerritory(from);
        var t2 = getTerritory(to);
        var p1 = t1.geometry.getCentroid();
        var p2 = t2.geometry.getCentroid();
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

        startAttackAnimation();
    }catch(ex){
    }
};
