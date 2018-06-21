// ==UserScript==
// @name         TagPro RL chat
// @description  Enhances the chat by stealing ideas from Rocket League
// @author       Ko
// @version      0.1.beta
// @include      *.koalabeast.com:*
// @include      *.jukejuice.com:*
// @include      *.newcompte.fr:*
// @downloadURL  https://github.com/wilcooo/TagPro-RLC/raw/master/tprlc.user.js
// @supportURL   https://www.reddit.com/message/compose/?to=Wilcooo
// @website      https://redd.it/no-post-yet
// @license      MIT
// ==/UserScript==


const show_time = 5000; // milliseconds to show the chat after a new message arrives
const box_width = 300;  // pixels
const font_size = 12;   // pixels
const lines = 8;        // number of visible chat lines
const line_height = 1.2;


const hide_common_system = true; // hide '15 bonus rank points' etc...
const hide_default_chat = true; // good for debugging.






// =====STYLES=====



// Create our own stylesheet to define the styles in:

var style = document.createElement('style');
document.head.appendChild(style);
var styleSheet = style.sheet;

// Remove the style rule for the input box from TagPro's stylesheet.
t:for (let sheet of document.styleSheets) if (sheet.href.endsWith('/stylesheets/style.css')) {
    for (let r in sheet.rules) if (sheet.rules[r].selectorText == '.game input#chat') {
        sheet.removeRule(r);
        break t;
    }
}

// The container (containing the chat history & text field)
styleSheet.insertRule(` #RLC-box {
position:absolute;
transition: background 500ms;
width:`+box_width+`px;
border-radius: 14px;
}`);

// The container when it's shown (while composing a message)
styleSheet.insertRule(`#RLC-box:focus-within {
background: rgba(0,0,0,.8);
}`);

// The chat history
styleSheet.insertRule(`#RLC-box .chats {
opacity:0;

/* Using padding on the left and right side, */
padding: 0 5px;
/* ..because width -including padding- should be 100% */
width:100%;

/* However, margin for the top and bottom, */
margin: 5px 0;
/* ..because the height -excluding margin- should be a fixed amount of lines */
height:`+(font_size*lines*line_height)+`px;

overflow:hidden;
line-height:`+line_height+`;
font-size:`+font_size+`px;
transition: all 500ms;
}`);

styleSheet.insertRule(`#RLC-box:focus-within .chats, #RLC-box .chats.shown {
opacity:1;
}`);

// A single message
styleSheet.insertRule(` #RLC-box .chats div {
text-shadow: -1px -1px 5px #000, 1px -1px 5px #000, -1px 1px 5px #000, 1px 1px 5px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000;
width:inherit;
}`);

styleSheet.insertRule(` #RLC-box .chats div .name {
text-transform: uppercase;
font-weight: bold;
margin-right: 3px;
display:inline-block;
}`);

styleSheet.insertRule(` #RLC-box .chats div .message {
}`);

styleSheet.insertRule(` #RLC-box .chats div.red       .name    { color:#FFB5BD; }`); // Red name
styleSheet.insertRule(` #RLC-box .chats div.red.team  .message { color:#FFB5BD; }`); // Red team message
styleSheet.insertRule(` #RLC-box .chats div.blue      .name    { color:#CFCFFF; }`); // Blue name
styleSheet.insertRule(` #RLC-box .chats div.blue.team .message { color:#CFCFFF; }`); // Blue team message
styleSheet.insertRule(` #RLC-box .chats div.group              { color:#E7E700; }`); // Group (name&message)
styleSheet.insertRule(` #RLC-box .chats div.mod       .name    { color:#00B900; }`); // Mod name
styleSheet.insertRule(` #RLC-box .chats div.system             { color:#F0E68C; }`); // system message
styleSheet.insertRule(` #RLC-box .chats div.announcement       { color:#FF88FF; }`); // announcement (server shutting down or something)


// The text field
styleSheet.insertRule(` #RLC-box input {
width:100%;
position: static;
font-size: `+font_size+`px;
padding: 3px;
border-radius: 8px;
background: none;
border: 2px outset CadetBlue;
outline: none;
transition: all 500ms;
display: none;
}`);

styleSheet.insertRule(` #RLC-box:focus-within input {
}`);

// The label on top of the text field
styleSheet.insertRule(` #RLC-box .label {
color: LightGrey;
margin-left: 35px;
}`);



// =====SELYTS=====







// Some DOM elements of TagPro
var canvas = document.getElementsByTagName('canvas')[0];
var game = document.getElementsByClassName('game')[0];
var default_chat = document.getElementById('chatHistory');
var input = document.getElementById('chat');


// Hide the default chat history
if (hide_default_chat) default_chat.style.display = 'none';



// Create the RLC container

var box = document.createElement('div');
box.id = 'RLC-box';
game.appendChild( box );

// Add the chat-log to that container

var chats = document.createElement('div');
chats.className = 'chats';
box.appendChild( chats );

// Add a label on top of the input, shown in case of team or group chat
var label = document.createElement('div');
label.className = 'label';
//label.innerText = '[Team]';
box.appendChild(label);

// Move the input inside RL chat
box.appendChild(input);

// Hide the chat when clicking outside the chatbox
input.addEventListener('focusout', cancelChat);

function cancelChat(){
    var cancelChat = $.Event('keydown');
    tagpro.keys.cancelChat.push('RL-chat');
    cancelChat.keyCode = 'RL-chat';
    $(input).trigger(cancelChat);
    tagpro.keys.cancelChat.pop();
}


/* global tagpro, $ */

tagpro.ready(function() {


    var timeout;



    //Listen for messages, and add them to RLC:

    tagpro.socket.on('chat', function (chat) {

        // Return disabled chat types
        if (tagpro.settings.ui) {
            if ( !tagpro.settings.ui.allChat && chat.to == "all" && chat.from ) return;
            if ( !tagpro.settings.ui.teamChat && chat.to == "team" ) return;
            if ( !tagpro.settings.ui.groupChat && chat.to == "group" ) return;
            if ( !tagpro.settings.ui.systemChat && chat.to == "all" && !chat.from ) return;
        }


        // Create the message div
        var message = document.createElement('div');

        var message_span = document.createElement('span');
        message_span.className = 'message';

        if (chat.from) {

            var name_span = document.createElement('span');
            name_span.className = 'name';

            if ( typeof chat.from == "number" ) {
                var player = tagpro.players[chat.from];

                if (player.auth) message.innerHTML = "&#10004" + message.innerHTML;

                if (player.team == 1) message.classList.add('red')
                else if (player.team == 2) message.classList.add('blue')

                name_span.innerText = player.name;
            } else name_span.innerText = chat.from;

            message.appendChild(name_span);

        } else {
            message.classList.add('system');
        }

        if ( chat.to == "group" ) {
            name_span.innerText = chat.from;
            message.classList.add('group');
        }

        if ( chat.from == "ADMIN_GLOBAL_BROADCAST" ) {
            message.classList.add('announcement')
            name_span.innerText = "ANNOUNCEMENT";
        }

        if ( chat.mod ) {
            message.classList.add('mod')
        }


        if( chat.to == "team") {
            message.classList.add("team");
        }

        message_span.innerText = chat.message;
        message.appendChild(message_span);

        if ( chat.c ) message_span.style.color = chat.c;

        // Append the message and scroll the chat
        chats.appendChild(message);
        chats.scrollTop = chats.scrollHeight;

        chats.classList.add('shown');

        clearTimeout(timeout);    // Remove any existing timeout

        timeout = setTimeout(()=>chats.classList.remove('shown'),show_time);   // Set a timeout to hide the chats*/
    });



    tagpro.chat.resize = function() {

        chats.style.left = canvas.offsetLeft + 10 + 'px';
        chats.style.top = canvas.offsetTop + 10 + 'px';

        box.style.left = canvas.offsetLeft + 10 + 'px';
        box.style.top = canvas.offsetTop + 10 + 'px';

        if (!hide_default_chat) {
            default_chat.style.left = canvas.offsetLeft + 10 + 'px';
            default_chat.style.top = canvas.offsetTop + canvas.height - default_chat.offsetHeight - 50 + 'px';
        }

        input.style.left = '';
        input.style.top = '';

    }

    tagpro.chat.resize();
});
