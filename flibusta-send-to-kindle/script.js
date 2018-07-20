// ==UserScript==
// @name         Flibusta to Kindle
// @namespace    http://www.philippatrick.com/
// @version      0.5
// @description  Sends books from Flibusta.net to kindle
// @author       Philip Patrick
// @supportURL   https://github.com/stpatrick2016/tampermonkey
// @downloadURL  https://raw.githubusercontent.com/stpatrick2016/tampermonkey/master/flibusta-send-to-kindle/script.js
// @match        http://flibusta.is/a/*
// @match        http://flibusta.is/b/*
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require      https://sdk.amazonaws.com/js/aws-sdk-2.275.1.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

'use strict';

//constants
var LINK_ID_PREFIX = 'kindle_link_';
var LINK_TEXT = '(в kindle)';

GM_config.init(
    {
        'id': 'Flibusta2Kindle', // The id used for this instance of GM_config
        'title': 'Options',
        'fields': // Fields object
        {
            'AccessToken': // This is the id of the field
            {
                'label': 'Access Token', // Appears next to field
                'type': 'text', // Makes this setting a text field
                'default': '' // Default value if user doesn't change it
            }
        }
    });

//setup AWS access
AWS.config.apiVersions = {
  sqs: '2012-11-05',
  // other service API versions
};

//add link for configuration
var prev = document.getElementById('block-librusec-booksearch');
var div = document.createElement('div');
div.className = 'block block-librusec';
var link = document.createElement('a');
link.href = '#';
link.innerText = 'Конфигурация Kindle';
link.onclick = function(){GM_config.open(); return false;}
div.appendChild(link);
prev.parentNode.insertBefore(div, prev);

//detect the page type we are on
var pageType = 'unknown';
if(document.location.href.search(/\/a\/\d+/i) >= 0)
{
    pageType = 'author';
}
else if(document.location.href.search(/\/b\/\d+/i) >= 0)
{
    pageType = 'book';
}

//read author and title
var title = '';
var author = '';
switch(pageType)
{
    case 'author':
        author = document.getElementsByClassName('title')[0].innerText;
        break;
    case 'book':
        title = document.getElementsByClassName('title')[0].innerText;
        title = title.replace(' (fb2)', ''); //remove the trailing (fb2)
        break;
}

console.log('Page type: ' + pageType + '. Author: ' + author + '. Title: ' + title);

//find all links leading to books
var rePlacement = /\/b\/(\d+)\/(?:download|mobi)$/i
var reName = /\/b\/\d+$/i
var links = document.getElementsByTagName('a');
for (var i=0; i<links.length; i++)
{
    var href = links[i].href;
    if(pageType == 'author' && reName.test(href))
    {
        title = links[i].innerText;
    }
    if(pageType == 'book' && /\/a\/\d+$/i.test(href))
    {
        author = links[i].innerText;
    }

    var match = rePlacement.exec(href);
    if(match != null)
    {
        var bookId = match[1];
        link = document.createElement('a');
        link.href = '#' + bookId;
        link.id = LINK_ID_PREFIX + bookId;
        link.innerText = LINK_TEXT;
        link.setAttribute('data-author', author);
        link.setAttribute('data-title', title);
        link.setAttribute('data-url', href.replace(/\/download|mobi/i, ''));
        link.setAttribute('data-id', bookId);
        link.onclick = function(){sendToKindle(this); return false;}
        links[i].parentNode.insertBefore(link, links[i].nextSibling);
        title = ''; //clear the title, so next line will start fresh
    }
}

function sendToKindle(elem)
{
    //read the data from the element
    var author = elem.getAttribute('data-author');
    var title = elem.getAttribute('data-title');
    var url = elem.getAttribute('data-url');
    var bookId = elem.getAttribute('data-id');

    var data = {
        "title": title,
        "author": author,
        "url": url,
        "bookId": bookId,
        "source": document.location.href
    };
    var params = {
        MessageBody: JSON.stringify(data),
        QueueUrl: "https://sqs.eu-central-1.amazonaws.com/238645272082/books-inbox",
        //MessageDeduplicationId: url,
        //MessageGroupId: author
    };

    //read the access token from the storage
    var accessToken = GM_config.get('AccessToken').split(',');
    //console.log("Access Key ID: " + accessToken[0]);
    //console.log("Secret access key: " + accessToken[1]);

    var sqs = new AWS.SQS({accessKeyId: accessToken[0], secretAccessKey: accessToken[1], region: "eu-central-1"});
    sqs.sendMessage(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            alert('Не получилось послать. Ошибка: ' + err);
        }
        else {
            console.log(data);           // successful response
            elem.innerText = '(Послано успешно)';
            console.log('Book sent. Author: ' + author + '. Title: ' + title + '. Url: ' + url);
            window.setTimeout(function(){document.getElementById(LINK_ID_PREFIX + bookId).innerText = LINK_TEXT;}, 3000);
        }
    });
}