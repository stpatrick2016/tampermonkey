//how to test locally: https://www.npmjs.com/package/lambda-local

var nodemailer = require('nodemailer');
var AWS = require('aws-sdk');
//var sqs = new AWS.SQS({apiVersion: '2012-11-05', accessKeyId:"AKIAINBIHETDASJBIYZA", secretAccessKey: "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"});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const TABLE_STYLE = "border: 1px solid black";
const TD_STYLE = "border: 1px solid black";
const TH_STYLE = "border: 1px solid black";

var mailBody = "";
var messagesToDelete = new Array();

exports.handler = function (event, callback) {

    if(!validateConfiguration()){
        callback(new Error('Configuration is not valid'));
        return;
    }

    //clear some parameters
    messagesToDelete = new Array();
    mailBody = 
        "<table style='" + TABLE_STYLE + "'><tr>"
        + addHeaderColumn("Timestamp")
        + addHeaderColumn("Author")
        + addHeaderColumn("Title")
        + addHeaderColumn("Book ID")
        + addHeaderColumn("Book URL")
        + addHeaderColumn("Source URL")
        + "</tr>";

    console.log("Receiving messages...");
    getRequestedBooks(receiveBooks);


}

function validateConfiguration(){
    var ret = true;
    if(!process.env.MAIL_USER){
        console.log("MAIL_USER is not configured");
        ret = false;
    }
    if(!process.env.MAIL_PASSWORD){
        console.log('MAIL_USER is not configured');
        ret = false;
    }
    if(!process.env.MAIL_TO){
        console.log('MAIL_TO is not configured');
        ret = false;
    }
    if(!process.env.QUEUE_URL){
        console.log('QUEUE_URL is not configured')
        ret = false;
    }
    return ret;
}

function sendEmail(callback){
    console.log('Mailing using account: ' + process.env.MAIL_USER);
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD
        }
    });

    //finish the HTML page
    mailBody += "</table>";

    var subject = process.env.MAIL_SUBJECT || 'Books to kindle requests';
    var mailOptions = {
        from: process.env.MAIL_USER,
        to: process.env.MAIL_TO,
        subject: subject,
        html: mailBody,
    };
      
    console.log('Sending email...');
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            callback();
        }
    });
}

function getRequestedBooks(callback){
    var params = {
        QueueUrl: process.env.QUEUE_URL,
        VisibilityTimeout: 10, //for debug purposes
        AttributeNames: [
            'SenderId', 'SentTimestamp'
        ]
    };
    sqs.receiveMessage(params, function(err, data){
        callback(err, data.Messages);
    });
}

function addHeaderColumn(name){
    return "<th style='" + TH_STYLE + "'>" + name + "</th>";
}

function addColumn(data){
    return "<td style='" + TD_STYLE + "'>" + data + "</td>";
}

function receiveBooks(error, messages){
    if(error){
        console.log(error);
    }
    else{
        if(messages != null && messages.length > 0){
            messages.forEach(msg => {
                messagesToDelete.push(msg.ReceiptHandle);
                var book = JSON.parse(msg.Body);
                var d = new Date(0);
                d.setUTCSeconds(msg.Attributes.SentTimestamp);
                mailBody += "<tr>" 
                    + addColumn(d.toDateString())
                    + addColumn(book.author)
                    + addColumn(book.title)
                    + addColumn(book.bookId)
                    + addColumn(book.url)
                    + addColumn(book.source)
                    + "</tr>";
            });
            getRequestedBooks(receiveBooks); //get more books
        }
        else if(messagesToDelete.length > 0){
            //no more messages, let's send the final email
            sendEmail(deleteReceivedMessages);
        }
        else{
            console.log("No books sent, nothing to do");
        }
    }
}

function deleteReceivedMessages()
{
    console.log("Deleting messages...");
    messagesToDelete.forEach(msg => {
        var params = {
            QueueUrl: process.env.QUEUE_URL,
            ReceiptHandle: msg
          };
          sqs.deleteMessage(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
          });
    });
}
