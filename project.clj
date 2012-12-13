(defproject gcmap "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [cheshire "2.0.6"]
                 [clj-http "0.2.7"]
                 [noir "1.2.2"]
                 [congomongo "0.1.7"]
                 [org.clojure/core.memoize "0.5.1"]
                 [org.clojure/core.cache "0.5.0"]
                 [paddleguru/enlive "1.2.0-alpha1"]
                 [clj-time "0.3.7"]
                 [org.clojure/core.logic "0.6.7"]
                 [org.clojars.crimeminister/gaka "0.2.2"]
                 [ring-middleware-format "0.2.3"]
                 [clj-stacktrace "0.2.4"]]
  :main gcmap.core
  :jvm-opts ["-Xms350m" "-Xmx350m" "-server" "-XX:+UseConcMarkSweepGC"
             "-XX:+CMSIncrementalMode" "-XX:+UseCompressedOops"
             "-XX:+DoEscapeAnalysis" "-XX:+UseBiasedLocking"
             "-XX:PermSize=64M" "-XX:MaxPermSize=85M"])
