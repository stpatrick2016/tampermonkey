// ==UserScript==
// @name         phpBB2 topic filter
// @namespace    http://www.philippatrick.net/
// @version      0.1
// @description  Hides topics that match or do not match specific words
// @author       Philip Patrick
// @match        *viewforum.php?f=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    var positive_expr = "";
    var negative_expr = "";

    var forumTable = document.getElementById('forum-table');
    //start from 1 to skip the header
    for(i=1; i<forumTable.rows.length; i++){
        var row = forumTable.rows[i];
        var topicContainer = row.getElementsByClassName('tt-text');
        if(topicContainer !== 'undefined' && topicContainer.length > 0){
            var topic = topicContainer[0].innerText;
            if(topic !== 'undefined' && topic.length > 0){
                var hide = false;
                var r;
                if(negative_expr.length > 0){
                    r = new RegExp(negative_expr, 'i');
                    hide = r.test(topic);
                }
                if(!hide && positive_expr.length > 0){
                    r = new RegExp(positive_expr, 'i');
                    hide = !r.test(topic);
                }
                
                if(hide){
                    row.style.display = 'none';
                    console.log('Hiding topic ' + topic);
                }
            }
        }
    }
})();