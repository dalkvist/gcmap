(ns gcmap.core
  (:use [ring.adapter.jetty]
        [gcmap.db :only [get-maps save-map!]])
  (:require (compojure [route :as route])
            (ring.util [response :as response])
            (ring.middleware [multipart-params :as mp])
            [noir.response :as res]
            [noir.server :as server]
            [hiccup.page-helpers :as ph]
            [noir.core :as noir]
            [hiccup.core :as hiccup]
            [compojure.core :as compojure]
            [cheshire.core :as j]))

(noir/defpartial layout [ & content]
  (ph/html5
   [:head
    [:title "Global Conflict campaign map" ]
    (ph/include-css "/style.css")
    (ph/include-css "theme/default/style.css")
    [:script {:src "http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.2.min.js"}]
    (ph/include-js "OpenLayers.debug.js")
    (ph/include-js "script2.js")

     ]
    [:body
     [:div#wrapper
      content
      ]]))

(noir/defpartial map-page [m]
  (layout [:h3 (:name m)]
          [:div#map]
          [:div#wcp [:span.a1] [:span.a2]]
          [:a#save {:href "#"} "save"]
          (ph/javascript-tag (str "var terr = " (j/generate-string m)))))

(noir/defpage "/" []
  (let [m (first (get-maps))]
    (map-page m)))

(noir/defpage "/:mapname" [mapname]
  (if-let [m (first (filter #(= mapname (:name %)) (get-maps)))]
    (map-page m)
    (map-page (last (get-maps)))))

(defonce server (atom nil))

(defn -main [& m]
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "8082"))]
    (reset! server (server/start port))))
