"use strict";
// lodash
var _ = require('lodash/array');

var fs = require('fs');

// Le modèle Tweet
import Tweet from "../models/tweet";

import Configuration from "../config/configuration";

export default class Utils {

    /**
     * Renvoie un nombre aléatoire compris entre le min et le max.
     *
     * @param min le nombre minimum
     * @param max le nombre maximum
     * @returns {*} un nombre alétoire
     */
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Renvoie une commande aléatoire.
     * @returns {*} une commande aléatoire
     */
    static getRandomMotion() {
        if (Utils.getRandomInt(0,9)%2 == 0) {
            return Configuration.CLASSIC_MOTIONS[0];
        } else {
            return Configuration.CLASSIC_MOTIONS[1];
        }
    }

    /*
    UTILITAIRES EN RAPPORT AVEC LES FICHIERS
     */
    /**
     * Renvoie le nombre de tweet réçu par Léa.
     * Le nombre est stocké sur un fichier présent sur
     * le raspberry.
     */
    static getCurrentRank(context) {
        context.rank =  fs.readFileSync(Configuration.RANK_FILE, "utf8");
    }

    /**
     * Remplis le rang du tweet avec le rang courant, sauf
     * si on est un admin auquel cas on mets "ADMIN" comme rang
     * @param tweet
     * @param rank
     */
    static fillTweetRank(tweet, rank) {
        tweet.rank = rank;
        if (Configuration.ADMINS.indexOf(tweet.screenName) != -1) {
            tweet.rank = "ADMIN";
        }
    }

    /**
     * Renvoie les paliers gagnants.
     */
    static getGamification() {
        return JSON.parse(fs.readFileSync(Configuration.GAMIFICATION_FILE, "utf8"));
    }

    /**
     * Indique si le tweet courant est gagnant en atteignant un palier
     * particulier. Ces paliers sont dynamiques et sont rechargé à chaque
     * lecture de tweet.
     *
     * @returns {boolean} true si le tweet est gagnant, false sinon
     */
    static isTweetWinner(gamification, rank) {
        var result = null;
        for (var prop in gamification) {
            if (rank == gamification[prop].rank) {
                console.log(prop + " atteint");
                result = gamification[prop];
            }
        }
        return result
    }

    /**
     * Sauvegarde le tweet courant.
     * Un contrôle est effectué pour ne pas enregistrer
     * 2 tweets identique.
     */
    static saveTweet(tweet) {
        if (tweet.fresh) {
            var configFile = fs.readFileSync(Configuration.TWEETS_DB);
            var config = JSON.parse(configFile);
            if(_.findIndex(config, function(o) { return o == tweet; }) == -1) {
                config.push(tweet);
            }
            var configJSON = JSON.stringify(config);
            console.log("Sauvegarde du tweet courant");
            fs.writeFileSync(Configuration.TWEETS_DB, configJSON);
        }
    }


    /**
     * Sauvegarde le nombre de tweets reçu par Léa.
     * Le nombre est stocké sur un fichier présent sur
     * le raspberry.
     * @param rank le nombre de tweet reçu
     */
    static updateAndSaveRankTweet(tweet, context) {
        if (Configuration.ADMINS.indexOf(tweet.screenName) == -1 && tweet.fresh) {
            var result =  parseInt(context.rank) + 1;
            context.rank = result;
            try {
                fs.writeFileSync(Configuration.RANK_FILE, context.rank, {"encoding": 'utf8'});
            } catch (err) {
                console.log(err);
            }
        }
        //return rank;
    }

    /**
     * Permets de démarrer ou de stopper Léa par l'envoi d'un
     * simple tweet. L'expéditeur doit faire parti des ADMINS
     * et doit respecter un formalisme de texte.
     *
     * @param tweet le tweet reçu
     */
    static startAndStopLea(tweet, clusterArduino, context) {
        console.log(tweet.isSpecial);

        if (Configuration.ADMINS.indexOf(tweet.screenName) != -1) {
            if (tweet.text.startsWith(Configuration.TWEET_LEA_STOP)) {
                console.log("tweet de stop");
                tweet.isSpecial = true;
                context.isLeaSpeaking = false;
                clusterArduino.send(Utils.generatePauseTweet());
            } else  if (tweet.text.startsWith(Configuration.TWEET_LEA_START)) {
                console.log("tweet de start");
                tweet.isSpecial = true;
                context.isLeaSpeaking = true;
            }
        }
    }

    /**
     * Génère et renvoie un tweet indiquant que Léa fait une pause
     * @returns {Tweet}
     */
    static generatePauseTweet() {
        var tweet = new Tweet("", "", Configuration.TEXT_LEA_PAUSE);
        tweet.isSpecial = true;
        return tweet;
    }
};




