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
    }
  })()
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
  return s != null && (s.toLowerCase()  == "true" || s.toLowerCase() == "yes" || s.toLowerCase()  == "1" || s.toLowerCase() == true);
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
        var territoryCount = function(army){return filterTerritory("army",army).length};
        var divitionCount = function(army){
                                       var terrs = $.map(filterTerritory('army',army), function(t){return t.attributes.divitions - 0});
                                       return terrs.reduce(function(a,b){return a + b;});
                                       };
        var tb = $.map(Object.keys(theaters),function(key){
                                                                    var res = new Object();
                                                                    res.theater = key;
                                                                    var armys = Object.keys(frequencies($.map(filterTerritory("theater", key), function(t){return t.attributes.army})));
                                                                    res.army = (armys.length == 1 ? armys[0] : ""); return res;  });

        var getArmyCPs = function(army){
                                    var bonuses = $.map($(tb).filter(function(){return this.army == army}),
                                                                       function(t){ return theaters[t.theater] - 0 });
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

var map, selectControl, selectedFeature, loadMap, getMap, territories;
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
    $("#saveform").toggle(true);
});

$("#saveform a").live("click", function(){
    var n = $("#name").val();
    var p = $("#password").val();
    var f = geojson.write(territories.features);
    $.post("http://" + window.location.host + "/save",
           {"name" : n, "password" : p, "newmap" : f},
           function(){});
    return false;
});

$("#maps a").live("click", function(){
    getMap($(this).text());
    updateWCP();
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
                       filter: new OpenLayers.Filter.Comparison({
                         type: OpenLayers.Filter.Comparison.EQUAL_TO,
                         property: "army",
                         value: ""
                       }),
                       symbolizer: {
                         fillColor:"#aaaaaa", strokeColor: "#cccccc"
                       }
                    }),
                     new OpenLayers.Rule({
                       filter: new OpenLayers.Filter.Comparison({
                         type: OpenLayers.Filter.Comparison.EQUAL_TO,
                         property: "army",
                         value: null
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
                         fillColor:"#550000", strokeColor: "#990000"
                       }
                    }),
                    new OpenLayers.Rule({
                      filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "army",
                        value: "gld"
                      }),
                       symbolizer: {
                         fillColor:"#000055", strokeColor: "#000099"
                       }
                    })
                  ]
           }
    );

    territories = new OpenLayers.Layer.Vector("Territories", {
        styleMap: new OpenLayers.StyleMap(style)
    });


    getMap = function(name){
        $.get("http://" + window.location.host + "/map/" +  name, function(data){ loadMap(data)});
    }

    loadMap = function(data){
        $("h3").text(data.name);
        territories.removeAllFeatures();
        territories.addFeatures(geojson.read(data));
        updateWCP();
    }


    getMap("latest");

   selectControl = new OpenLayers.Control.SelectFeature(territories, {hover:false,box:false,onSelect: onFeatureSelect, onUnselect: onFeatureUnselect})
   map.addControl(selectControl);
   selectControl.activate()

   map.addLayers([basemap, territories]);
   map.addControl(new OpenLayers.Control.LayerSwitcher());
   map.zoomToMaxExtent();
   updateWCP();
}
);
