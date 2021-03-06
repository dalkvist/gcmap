(ns gcmap.core
  (:use [ring.adapter.jetty]
        [gcmap.db :only [get-maps save-map!]]
        [ring.middleware.format-params :only [wrap-restful-params]])
  (:require (compojure [route :as route])
            (ring.util [response :as response])
            (ring.middleware [multipart-params :as mp])
            [noir.response :as res]
            [noir.request :as req]
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
    (ph/include-css "farbtastic/farbtastic.css")
    [:script {:src "http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.2.min.js"}]
    (ph/include-js "OpenLayers.debug.js")
    (ph/include-js "Direction.js")
    (ph/include-js "script2.js")
    (ph/include-js "jquery.svg.js")
    (ph/include-js "jquery.svganim.js")
    (ph/include-js "farbtastic/farbtastic.js")

     ]
    [:body
     [:div#wrapper
      content
      ]]))

(noir/defpartial map-page [m & {:keys [campaign] :or {campaign 5}}]
  (println "map page" (select-keys m [:name :private]))
  (layout [:h3 (:name m)]
          [:div#maps (for [mname (reverse (sort-by :week (map #(select-keys % [:name :week :campaign :state])
                                                              (filter #(and (not (get % :private))
                                                                            (= (str campaign)
                                                                               (str (get % :campaign 0))))
                                                                      (get-maps)))))]
                       (ph/link-to "#" (:name mname)))]
          [:div#map]
          [:div#sidebar
           [:div#info.selected
            [:a.info {:href "#"} "info"]
            [:div#wcp [:span.a1] [:span.a2]]]
           [:div#theaters [:a.theaters {:href "#"} "Theraters"]
            [:div.sub [:div]
             (fh/reset-button "clear")]]
           [:div#search
            [:a.seach {:href "#"} "search"]
            [:div.sub
             (fh/form-to [:get ""]
               (fh/label "lseach" "seach map:")(fh/text-field "mapSearch")
               (fh/submit-button "search")
               (fh/reset-button "clear")
               [:div.clear])]]
           [:div#attack
            [:a.attack {:href "#"} "attacking"]
            [:div.sub
             (fh/form-to [:get ""]
               [:div [:span.wrapper]
               [:div.clear]]
               (fh/submit-button "ATTACK!")
               (fh/reset-button "cancel")
               [:div.clear])]]
           [:div#edit.edit
            [:a.edit {:href "#"} "edit"]
            [:div.sub
             (fh/form-to [:get ""]
               [:span.select
                (fh/radio-button "edit" true "no") (fh/label "lform" "Pan")
                (fh/radio-button "edit" false "territory")(fh/label "lform" "Select territory")
                (fh/radio-button "edit" false "mapsettings")(fh/label "lform" "Map")]
               [:div.info]
               [:div.map]
               [:input#update {:type "button" :value "apply changes"}]
               (fh/submit-button "update"))
             [:div.clear]]]
           [:div#saveform.edit
            [:a#save {:href "#"} "save"]
            [:div.sub
             (fh/form-to [:post "save"]
               (fh/hidden-field "terr")
               [:div.info]
               (fh/label "lPass" "password:")
               (fh/text-field "password")
               (fh/submit-button "save"))
             [:div.clear]]]
           [:div#todo
            [:a#todo {:href "#"} "TODO"]
            [:div.sub
             [:h4 "in no particular order"]
             [:p "move offset, divisions and buildings to points"]
             [:p "basemap settings: url, bounds, max size"]
             [:p "map settings: campaign, week, army; name, colors; phase; BD attack, reinforcement etc"]
             [:p "add/remove territories"]
             [:p "remove nodes in territory shape"]
             [:p "change building values to boolean"]
             [:p "select attack territories based on attacking army"]
             [:p "wcp theater bonus rule"]
             [:p "connected(territory 1, territory 2)"]
             [:p "only allow attacks on connected territories"]]]]
           (ph/javascript-tag (str "var terr = " (j/generate-string m)))))

(noir/defpage "/favicon.ico" [] "")

(noir/defpage "/" {:keys [mapname]}
  (println "mapname"              (-> (first (filter #(not (:private %))
                                          (if mapname (filter #(= (:name %) mapname) (get-maps)) (get-maps))))
                             (select-keys [:name :private])))
  (let [m (first (filter #(not (:private %))
                         (if mapname (filter #(= (:name %) mapname) (get-maps)) (get-maps))))]
    (println "m " (select-keys m [:name :private]))
    (map-page m)))

(noir/defpage [:get "/map/:mapname"] {:keys [mapname]}
  (res/json (if-let [m (first (filter #(= mapname (:name %)) (get-maps)))]
              m
              (last (filter #(not (:private %)) (get-maps))))))

(noir/defpage [:post "/save"] {:as m}
  (res/json
   (let [password-type (case (hash (m :password))
                         -2099765068 :public
                         -712624587 :private
                         false)
         name (case password-type :private (str (java.util.UUID/randomUUID)) (:name m))]
     (if (and (m :name) (m :newmap) (m :password) (keyword? password-type))
       (do (save-map! (merge (j/decode (m :newmap)) (dissoc m :newmap :password)
                             {:private (case password-type :private true false) :name name}))
           (if (= :private password-type)
             (response/redirect (str "http://" ((:headers (req/ring-request)) "host") "/?mapname=" name))
             (j/encode {:message "map saved" :name (:name m)})))
       (j/encode {:message "password error" :name (:name m)})))))

(noir/defpage [:get "/export"] []
  (res/json (get-maps)))

(defonce server (atom nil))

(defn -main [& m]
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "8082"))]
    (reset! server (server/start port))
    (server/add-middleware wrap-restful-params mp/wrap-multipart-params)))
