// ==UserScript==
// @name         TagPro RL Chat
// @description  Enhances the chat by mimicking Rocket League
// @author       Ko
// @version      1.0
// @include      *.koalabeast.com:*
// @include      *.koalabeast.com/
// @include      *.jukejuice.com:*
// @include      *.newcompte.fr:*
// @downloadURL  https://github.com/wilcooo/TagPro-RL/raw/master/tprlc.user.js
// @supportURL   https://www.reddit.com/message/compose/?to=Wilcooo
// @website      https://redd.it/no-post-yet
// @require      https://cdnjs.cloudflare.com/ajax/libs/autolinker/1.6.2/Autolinker.min.js
// @license      MIT
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     ### --- OPTIONS --- ###                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  //
                                                                                                                      //  //
// Looking for options? They are on the homepage! Look for a green 'RL-chat' button.                                  //  //
// The only thing you can change here are what system messages will be replaced.                                      //  //
// null means the system message won't be shown at all, any other string will replace                                 //  //
// the message. The main goal is to reduce the space these messages take up.                                          //  //
                                                                                                                      //  //
const system_messages = {                                                                                             //  //
    "Since you refreshed, you will have to wait 10 seconds to respawn.": "Wait 10 seconds after a refresh.",
    "Since there aren't many players in this game yet, you'll get a bonus": "There aren't many players in this game",
    "20 rank points if you stick around and make it a real match.": null,
    "15 rank points if you stick around and make it a real match.": null,
    "10 rank points if you stick around and make it a real match.": null,
    "5 rank points if you stick around and make it a real match.": null,
    "Thanks, you're getting 5 bonus rank points for that.": null,
    "THROWBACK MAP!": "This is a throwback map.",
    "TagPro Neomacro Plus Loaded!": null,
    "You can't switch teams right now.": "You can't switch teams right now.",
}                                                                                                                     //  //
                                                                                                                      //  //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  //
//                                                                                     ### --- END OF OPTIONS --- ###     //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////






//////////////////////////////////////
// SCROLL FURTHER AT YOUR OWN RISK! //
//////////////////////////////////////






/* Structure: (for reference)

div#RLC-box

    div.chats-wrapper          // Necessary to define the exact height of the next div
                               // by placing n empty lines in it.

        div.chats              // inherits the height of the wrapper

            div
                span.name
                span.message

            div
                span.name
                span.message

            //etc...

    label                      // can show 'team', 'group', 'mod' or nothing

        input#chat             // Note: this is the original TP chatbox!

*/




// =====CONFIG SECTION=====


// DON'T CHANGE THE OPTIONS HERE, AS YOU CAN CHANGE THEM ON THE TAGPRO HOME PAGE!

GM_config.init(
    {
        id: 'RL-Chat',
        title: 'TagPro RL Chat Configuration',
        fields:
        {
            'position':
            {
                'label': 'Position',
                'section': 'Appearance',
                'type': 'select',
                'options': ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
                'default': 'top-left',
            },
            'font_size':
            {
                'label': 'Font size (pixels)',
                'type': 'int',
                'default': 12,
                'min': 0,
            },
            'lines':
            {
                'label': 'Height of the box (amount of lines!)',
                'type': 'int',
                'default': 8,
                'min':0,
            },
            'box_width':
            {
                'label': 'Width of the box (pixels)',
                'type': 'int',
                'default': 300,
                'min': 0,
            },
            'hide_system':
            {
                'label': 'Hide the most annoying system messages ("Since there aren\'t many players...")',
                'type': 'checkbox',
                'default': true,
            },
            'show_time':
            {
                'label': 'Time to show RL-chat after message (seconds)',
                'section': ['Showing/Hiding the chat',
                            'By default, the chat is hidden. Once a message arrives, the chat (including past messages) will be shown for a few seconds.'],
                'type': 'int',
                'default': 6,
                'min':0,
            },
            'permanent_end':
            {
                'label': 'Permanently show RL-chat after the game has ended',
                'type': 'checkbox',
                'default': true,
            },
            'permanent_always':
            {
                'label': 'Permanently show RL-chat. Always',
                'type': 'checkbox',
                'default': false,
            },
            'hide_default_chat':
            {
                'label': 'Hide the default chat (Recommended)',
                'type': 'checkbox',
                'default': true,
            },
        }
    });


// Add the config button to the TagPro profile page.
if (!location.port) {
    // Add a button to the homepage

    var button = document.createElement('a');
    button.classList.add('btn','button');
    button.style.cursor = 'pointer';
    button.id = 'RLC_btn';
    button.innerHTML = 'RL Chat<span class="sub-text">Configuration</span>';
    button.style.margin = '10px';

    button.onclick = function(){GM_config.open();};      // A click opens the options

    var btn_location = $("#userscript-home")[0] || $("#play")[0] || function(){
        console.error('RL-Chat: Could not place the RL-chat button to the homepage. Did the layout change?');
        tagpro.helpers.displayError('RL-Chat: Could not place the RL-chat button to the homepage. Did the layout change?');
        return null;
    }();

    if (!btn_location) return;

    if ($("#userscript-home")[0]) $("#userscript-home")[0].classList.remove('hidden');

    btn_location.appendChild(button);

    return;
}




const position  = GM_config.get('position'); // top- bottom- -left -right (8 possibilities)
const show_time = GM_config.get('show_time')*1000; // milliseconds to show the chat after a new message arrives
const box_width = GM_config.get('box_width');      // pixels
const font_size = GM_config.get('font_size');      // pixels
const lines     = GM_config.get('lines');          // number of visible chat lines

const permanent_end = GM_config.get('permanent_end');
const permanent_always = GM_config.get('permanent_always');
const hide_system = GM_config.get('hide_system'); // hide '15 bonus rank points' etc...
const hide_default_chat = GM_config.get('hide_default_chat'); // good for debugging.



// =====NOITCES GIFNOC=====











// =====CSS SECTION=====



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

// The outer container (containing the chat history & text field)
// Define font-size here, to give the chat-wrapper as well as the chat
styleSheet.insertRule(` #RLC-box {
position:absolute;
transition: background 500ms;
width:`+box_width+`px;
border-radius: 10px;
font-size:`+font_size+`px;
margin: 10px;
}`);



// The container when it's shown (while composing a message)
styleSheet.insertRule(`#RLC-box:focus-within, #RLC-box.permanent {
background: rgba(0,0,0,.8);
}`);


// The wrapper around the .chats div
styleSheet.insertRule(`#RLC-box .chats-wrapper {
margin: 5px 0;
position:relative;
}`);

// Add 8 empty lines in it to set the wanted height.
// Using em, or any other method, will result in non-pixel perfect
// heights while zooming (depending on the browser).
styleSheet.insertRule(` #RLC-box .chats-wrapper:after {
content: "`+ '\\a'.repeat(lines) +`";
white-space: pre;
}`);



// The chat history, which will always contain ALL chats.
// Older chats will just be scrolled out of view
// Opacity set to 0 by default.
styleSheet.insertRule(`#RLC-box .chats {
opacity:0;
overflow:hidden;
transition: opacity 500ms;
position: absolute;
height: 100%;
width: 100%;
padding: 0 5px;
top: 0;
left: 0;
}`);


// This same box, but when it's .shown
// Using opacity instead of display:none or visibility allows us to use CSS transistion
styleSheet.insertRule(`#RLC-box:focus-within .chats, #RLC-box.permanent .chats, #RLC-box .chats.shown {
opacity:1;
}`);

// A single message. Combining these multiple shadows creates a hard 1px line around the text,
// combined with a softer 5px shadow.
// display:inline; to make sure the height doesn't deviate from the set line-height
//  (we need this to make sure that exactly 8 lines fit in the box)
styleSheet.insertRule(` #RLC-box .chats div {
text-shadow: -1px -1px 5px #000, 1px -1px 5px #000, -1px 1px 5px #000, 1px 1px 5px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000;
width:inherit;
display: inline-block;
}`);

// The name of a chat message
styleSheet.insertRule(` #RLC-box .chats div .name {
text-transform: uppercase;
font-weight: bold;
margin-right: 3px;
}`);


// Authenticated name: add a green ✔
styleSheet.insertRule(` #RLC-box .chats div.auth .name::before {
content: "✔";
color: #BFFF00;
font-size: 8px;
}`);

// Changing the style of the .name, .message or full chat div depending on what kind of message it is.
styleSheet.insertRule(` #RLC-box .chats div.red       .name    { color:#FFB5BD; }`); // Red name
styleSheet.insertRule(` #RLC-box .chats div.red.team  .message { color:#FFB5BD; }`); // Red team message
styleSheet.insertRule(` #RLC-box .chats div.blue      .name    { color:#CFCFFF; }`); // Blue name
styleSheet.insertRule(` #RLC-box .chats div.blue.team .message { color:#CFCFFF; }`); // Blue team message
styleSheet.insertRule(` #RLC-box .chats div.group              { color:#E7E700; }`); // Group (name&message)
styleSheet.insertRule(` #RLC-box .chats div.mod       .name    { color:#00B900; }`); // Mod name
styleSheet.insertRule(` #RLC-box .chats div.system             { color:#F0E68C; }`); // system message
styleSheet.insertRule(` #RLC-box .chats div.announcement       { color:#FF88FF; }`); // announcement (server shutting down or something)

// Links. Same color as the message, but underlined.
styleSheet.insertRule(` #RLC-box a {
color: #8BC34A;
text-decoration: underline double;
}`);


// The label around the input field.
// This thing has the borders, because we want the
// label text to be inside the border too. ('team', 'group', 'mod'...)
// display:table; will make the input behave like a table-cell, which extends it to the end of the line.
styleSheet.insertRule(` #RLC-box label {
border-radius: 8px;
margin: 3px;
width: calc(100% - 6px);
padding: 3px;
border: 2px inset Gray;
transition: opacity 500ms;
opacity: 0;
display: table;
font-weight: normal;
background: rgba(255,255,255,.15);
cursor: text;
}`);

styleSheet.insertRule(` #RLC-box:focus-within label {
border: 2px outset CadetBlue;
}`);

// Same trick as before to hide/show it.
styleSheet.insertRule(` #RLC-box:focus-within label, #RLC-box.permanent label {
opacity: 1;
}`);

// The style of the label text ('team', 'group', 'mod')
// We have to add content:​ , because otherwise an empty
// input-box would have no height.
styleSheet.insertRule(` #RLC-box label:before {
display: table-cell;
font-weight: bold;
color: LightGrey;
content: '​';
}`);

// Add text to the label, depending on the type of chat you're composing.
styleSheet.insertRule(` #RLC-box label.team:before  {width:1px; padding-right:3px; content: 'team';}`);
styleSheet.insertRule(` #RLC-box label.group:before {width:1px; padding-right:3px; content: 'group';}`);
styleSheet.insertRule(` #RLC-box label.mod:before   {width:1px; padding-right:3px; content: 'mod';}`);

// The input field
// note: this is the original TagPro element, it'll just be moved to the new location
// This way we don't have to bother with the logic behind opening the box, and sending a chat
styleSheet.insertRule(` #RLC-box input {
padding: 0;
position: static;
border: none;
background: none;
outline: none;
transition: all 500ms;
display: none;
width: 100%;
}`);

// Change the text-color of the chat you're composing, based on the type
styleSheet.insertRule(` #RLC-box label.team.red  input {color:#FFB5BD;}`); // Red text
styleSheet.insertRule(` #RLC-box label.team.blue input {color:#CFCFFF;}`); // Blue text
styleSheet.insertRule(` #RLC-box label.group     input {color:#E7E700;}`); // Yellow text
styleSheet.insertRule(` #RLC-box label.mod       input {color:#00B900;}`); // Green text





// =====NOITCES SSC=====





// =====DOM SECTION=====



// Some default DOM elements TagPro
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
if (permanent_always) box.classList.add('permanent');

// Add a wrapper for around the chats

var wrapper = document.createElement('div');
wrapper.className = 'chats-wrapper';
box.appendChild(wrapper);

// Add the chat-log to that wrapper

var chats = document.createElement('div');
chats.className = 'chats';
wrapper.appendChild( chats );


// Add a label around the input, shown in case of team or group chat
var label = document.createElement('label');
box.appendChild(label);

// Move the input inside RL chat
label.appendChild(input);



// =====NOITCES MOD=====





// =====LOGIC SECTION=====



/* global tagpro, $, Autolinker */

var autolinker = new Autolinker( {
    urls : {
        schemeMatches : true,
        wwwMatches    : true,
        tldMatches    : true
    },
    email       : true,
    phone       : false,
    mention     : false,
    hashtag     : false,

    stripPrefix : true,
    stripTrailingSlash : true,
    newWindow   : true,

    truncate : { length:25, location:'end' }
} );


tagpro.ready(function() {


    var timeout;



    //Listen for messages, and add them to RLC:

    function handleChat (chat) {

        // Return disabled chat types
        if (tagpro.settings.ui) {
            if ( !tagpro.settings.ui.allChat && chat.to == "all" && chat.from ) return;
            if ( !tagpro.settings.ui.teamChat && chat.to == "team" ) return;
            if ( !tagpro.settings.ui.groupChat && chat.to == "group" ) return;
            if ( chat.to == "all" && !chat.from ) {
                if (!tagpro.settings.ui.systemChat) return;
                if (hide_system && chat.message in system_messages) {
                    chat.message = system_messages[chat.message];
                    if (!chat.message) return;
                }
            }
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

                if (player.auth) message.classList.add('auth');

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
        message_span.innerHTML = autolinker.link( message_span.innerHTML );

        // Linkify the message, and append it
        message.appendChild(message_span);

        if ( chat.c ) message_span.style.color = chat.c;

        // Append the message and scroll the chat
        chats.appendChild(message);
        chats.scrollTop = chats.scrollHeight;

        chats.classList.add('shown');

        clearTimeout(timeout);    // Remove any existing timeout

        timeout = setTimeout(()=>chats.classList.remove('shown'),show_time);   // Set a timeout to hide the chats*/
    }

    tagpro.socket.on('chat', handleChat);
    if (tagpro.group.socket) tagpro.group.socket.on('chat', handleChat);

    // TODO: click on label opens all-chat (if not yet opened)


    // Change the built-in jQuery function .show()
    //  to make it trigger an event.
    // This function is used by TagPro to show the input-box.
    $.fn.org_show = $.fn.show;
    $.fn.show = function(speed, easing, callback) {
        $(this).trigger('show');
        return $(this).org_show(...arguments);
    }
    // Same for .hide()
    $.fn.org_hide = $.fn.hide;
    $.fn.hide = function(e, r, i) {
        $(this).trigger('hide');
        return $(this).org_hide(...arguments);
    }

    // Keep track of what is the last pressed key,
    // so that we know what label to add.
    var last_keyCode = null;
    document.addEventListener('keydown', event => last_keyCode = event.keyCode);

    // When the input is shown, add a label
    $(input).on('show',function(){
        setTimeout(function(){
            if ( tagpro.keys.chatToAll.indexOf(last_keyCode) > -1 )
                label.classList.add('all');
            else label.classList.remove('all');

            if ( tagpro.keys.chatToTeam.indexOf(last_keyCode) > -1 ) {
                label.classList.add('team');
                label.classList.add(tagpro.players[tagpro.playerId].team == 1 ? 'red' : 'blue');
            } else label.classList.remove('team');

            if ( tagpro.keys.chatToGroup.indexOf(last_keyCode) > -1 )
                label.classList.add('group');
            else label.classList.remove('group');

            if ( tagpro.keys.chatAsMod.indexOf(last_keyCode) > -1 )
                label.classList.add('mod');
            else label.classList.remove('mod');
        });
    });

    // When the input is hidden, hide the label
    $(input).on('hide',function(){
        label.classList.remove('all');
        label.classList.remove('team');
        label.classList.remove('group');
        label.classList.remove('mod');
    });

    // Permanently show the chat box after a game ends
    if (permanent_end)
        tagpro.socket.on('end', function(end) {
            // Show the box
            box.classList.add('permanent');
        });

    // When clicking the label, open the chat
    // (this will only be used once a game has ended)
    label.addEventListener('click', function(){
        if (input.style.display == 'none') {
            // Open the chat box:
            var e = new Event("keydown");
            e.keyCode = 'RL-Chat';
            tagpro.keys.chatToAll.push('RL-Chat');
            document.dispatchEvent(e);
            tagpro.keys.chatToAll.pop();
        }
    });

    // When the input looses focus, hide it
    // (so that it can be reopened with Enter or T or whatever)
    input.addEventListener('blur', function(){
        if (input.style.display == 'inline-block') {
            // Open the chat box:
            var e = new Event("keydown");
            e.keyCode = 'RL-Chat';
            tagpro.keys.cancelChat.push('RL-Chat');
            input.dispatchEvent(e);
            tagpro.keys.cancelChat.pop();
        }
    });

    // Modify TagPro's resize function, which is called whenever
    // your window size changes. (going fullscreen, zooming, etc.)
    tagpro.chat.org_resize = tagpro.chat.resize;
    tagpro.chat.resize = function() {

        box.style.left = '';
        box.style.right = '';
        box.style.top = '';
        box.style.bottom = '';

        switch (position) {
            case 'top-right':
                box.style.right = game.offsetWidth - canvas.offsetLeft - canvas.offsetWidth + 'px';
                box.style.top = canvas.offsetTop + 'px';
                break;
            case 'bottom-right':
                box.style.right = game.offsetWidth - canvas.offsetLeft - canvas.offsetWidth + 'px';
                box.style.bottom = window.innerHeight - canvas.offsetTop - canvas.offsetHeight + 'px';
                break;
            case 'bottom-left':
                box.style.left = canvas.offsetLeft + 'px';
                box.style.bottom = window.innerHeight - canvas.offsetTop - canvas.offsetHeight + 'px';
                break;
            case 'top-left':
            default:
                box.style.left = canvas.offsetLeft + 'px';
                box.style.top = canvas.offsetTop + 'px';
                if (tagpro.settings.ui.performanceInfo) box.style.marginTop = '30px';
        }


        chats.scrollTop = chats.scrollHeight;

        if (!hide_default_chat) {
            default_chat.style.left = canvas.offsetLeft + 10 + 'px';
            default_chat.style.top = canvas.offsetTop + canvas.height - default_chat.offsetHeight - 50 + 'px';
        }

        return tagpro.chat.org_resize(...arguments);

    }

    // Call it once to make sure everyting is positioned correctly at the start.
    tagpro.chat.resize();

});


// =====NOITCES CIGOL=====
