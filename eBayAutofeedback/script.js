// ==UserScript==
// @name         Autofeedback on eBay
// @namespace    http://patrick.dev/
// @version      0.1
// @description  Autofill feedback on ebay
// @author       Philip Patrick
// @match        http://feedback.ebay.com/ws/eBayISAPI.dll?LeaveFeedback*
// @grant        none
// ==/UserScript==

var positiveRadio = null;

(function() {
    'use strict';

    // Your code here...
    var radios = document.getElementsByName("overallRatingId0");
    
    if(radios !== null)
    {
        for(var i=0; i<radios.length; i++){
            if(radios[i].value == "positive"){
                positiveRadio = radios[i];
                positiveRadio.onchange = function(){
                    if(positiveRadio !== null && positiveRadio.checked === true){
                        document.getElementById("comment00").value = "As described, fast shipping, suggesting the seller!";
                    }
                };
                break;
            }
        }
    }
})();
