(ns gcmap.core
  (:use [ring.adapter.jetty]
        [gcmap.db :only [get-maps save-map!]]
        [ring.middleware.format-params :only [wrap-restful-params]])
  (:require (compojure [route :as route])
            (ring.util [response :as response])
            (ring.middleware [multipart-params :as mp])
            [noir.response :as res]
            [noir.server :as server]
            [noir.validation :as vali]
            [hiccup.form-helpers :as fh]
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
    (ph/include-js "Direction.js")
    (ph/include-js "script2.js")

     ]
    [:body
     [:div#wrapper
      content
      ]]))

(noir/defpartial map-page [m]
  (layout [:h3 (:name m)]
          [:div#maps (for [m (reverse (sort (map :name (get-maps))))]
                       (ph/link-to "#" m))]
          [:div#search (fh/form-to [:get ""] (fh/label "lseach" "seach map:")(fh/text-field "mapSearch") (fh/submit-button "search"))]
          [:div#map]
          [:div#wcp [:span.a1] [:span.a2]]
          [:div#tools
           [:a.attack {:href "#"} "attacking"]
           [:a#save {:href "#"} "save"]]
          [:div#saveform.popup (fh/form-to [:post "save"]
                                     (fh/hidden-field "terr")
                                     (fh/label "lName" "name:")
                                     (fh/text-field "name")
                                     (fh/label "lPass" "password:")
                                     (fh/text-field "password")
                                     (ph/link-to "#save" "save"))]
          [:div#attack.popup (fh/form-to [:get ""]
                              (fh/label "lfrom" "attack from:") (fh/text-field "from")
                              (fh/label "lfrom" "to:") (fh/text-field "to")
                              (fh/label "ldivitions" "nr divitions:")(fh/text-field "divitions")
                              (fh/submit-button "ATTACK!"))]
          (ph/javascript-tag (str "var terr = " (j/generate-string m)))))

(noir/defpage "/favicon.ico" [] "")

(noir/defpage "/" []
  (let [m (first (get-maps))]
    (map-page m)))

(noir/defpage [:get "/map/:mapname"] {:keys [mapname]}
  (res/json (if-let [m (first (filter #(= mapname (:name %)) (get-maps)))]
              m
              (last (get-maps)))))

(noir/defpage [:post "/save"] {:as m}
    (layout (str (m :name) " " (m :newmap) " " (m :password))
          (when (and (m :name) (m :newmap) (m :password) (= (m :password) "super secret gc password"))
            (str (m :name) " " (m :newmap) " " (m :password))
            (save-map! (assoc (j/decode (m :newmap)) :name (m :name)  )))))

(noir/defpage [:get "/export"] []
  (res/json (get-maps)))

(defonce server (atom nil))

(defn -main [& m]
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "8082"))]
    (reset! server (server/start port))
    (server/add-middleware wrap-restful-params mp/wrap-multipart-params)))
