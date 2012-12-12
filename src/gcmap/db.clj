(ns gcmap.db
  (:use [somnium.congomongo]
        [somnium.congomongo.config :only [*mongo-config*]])
  (:require [cheshire.core :as j]))

(declare save-map!)

(defn- split-mongo-url [url]
  "Parses mongodb url from heroku, eg. mongodb://user:pass@localhost:1234/db"
  (let [matcher (re-matcher #"^.*://(.*?):(.*?)@(.*?):(\d+)/(.*)$" url)] ;; Setup the regex.
    (when (.find matcher) ;; Check if it matches.
      (zipmap [:match :user :pass :host :port :db] (re-groups matcher))))) ;; Construct an options map.

(defn- maybe-init []
  "Checks if connection and collection exist, otherwise initialize."
  (when (not (connection? *mongo-config*)) ;; If global connection doesn't exist yet.
    (let [mongo-url (or (get (System/getenv) "MONGOLAB_URI")            ;; Heroku puts it here.
                        "mongodb://user:pass@127.0.0.1:27017/bf3map") ;; if not use localhost
          config    (split-mongo-url mongo-url)] ;; Extract options.
      (println "Initializing mongo @ " mongo-url)
      (mongo! :db (:db config) :host (:host config) :port (Integer. (:port config))) ;; Setup global mongo.
      (authenticate (:user config) (:pass config)) ;; Setup u/p.
      (doseq [coll [:map]]
        (or (collection-exists? coll);; Create collection if it doesn't exist.
            (do (create-collection! coll)
                (save-map! (-> (slurp "http://dl.dropbox.com/u/1691940/gcmap/backup.js")
                              (j/parse-string true)
                              (assoc :name "week 5 d")))
                ;; (when (= coll :traderausers)
                ;;   (mass-insert! colts-l default-users))
             )))
      )))

(defn- clean-map [map]
  (select-keys map (remove #(= :_id %) (keys map))))

(defn get-maps []
  (maybe-init)
  (map clean-map
       (fetch :map)))

(defn save-map! [map]
  (maybe-init)
  (insert! :map map))
