
/* 
source = $("#app_chat-dialog_chat-messages_time").html();
template = Handlebars.compile(source);
context = { 
    time: "JAN 15, 2020"
};
html = template(context);
$('.app .chat-dialog .chat-messages').html($('.app .chat-dialog .chat-messages').html() + html);

source = $("#app_chat-dialog_chat-messages").html();
template = Handlebars.compile(source);
context = { 
    image: "https://dcavozvb40vtt.cloudfront.net/api/file/0ubAiutLQU2XjZSGvd37", 
    name: "Mark",
    surname: "Aien",
    time: "20min ago",
    text: "Hello! That's my first day here!"
};
html = template(context);
for(var i = 0; i < 10; i++){
    $('.app .chat-dialog .chat-messages').html($('.app .chat-dialog .chat-messages').html() + html);
}

context = { 
    image: "https://dcavozvb40vtt.cloudfront.net/api/file/0ubAiutLQU2XjZSGvd37", 
    name: "Mark",
    surname: "Aien",
    time: "20min ago",
    text: "Hello! That's my first day here!",
    img: [
        { src: "https://cdn.pixabay.com/photo/2017/01/12/06/25/birds-1973872_960_720.jpg" },
        { src: "https://cdn.pixabay.com/photo/2017/01/12/06/25/birds-1973872_960_720.jpg" }
    ]
};
html = template(context);
$('.app .chat-dialog .chat-messages').html($('.app .chat-dialog .chat-messages').html() + html);
 */

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function chatClick(callback){
	$('.app .chat-list .list-chat li').on('click', (e)=>{
		if(!$(e.currentTarget).hasClass('active')) callback($(e.currentTarget));
	});
}

function addChat(obj){
	const source = $("#app_chat-list_list-chat").html();
	const template = Handlebars.compile(source);
	const context = { 
		image: obj.image, 
		name: obj.name,
		surname: obj.surname,
		text: obj.text,
		peer: obj.peer
	};
	const html = template(context);
	$('.app .chat-list .list-chat').html(html + $('.app .chat-list .list-chat').html());
}

function addMessageTime(time){
	const source = $("#app_chat-dialog_chat-messages_time").html();
	const template = Handlebars.compile(source);
	const context = { 
		time: time
	};
	const html = template(context);
	$('.app .chat-dialog .chat-messages').html($('.app .chat-dialog .chat-messages').html() + html);
}

function addMessage(obj){
	const source = $("#app_chat-dialog_chat-messages").html();
	const template = Handlebars.compile(source);
	const context = { 
		image: obj.image, 
		name: obj.name,
		surname: obj.surname,
		time: obj.time,
		text: obj.text,
		img: obj.img || null
	};
	const html = template(context);
    $('.app .chat-dialog .chat-messages').html($('.app .chat-dialog .chat-messages').html() + html);
}

function changeDescribtionChat(text){
	return $('.app .chat-dialog .chat-info .chat-text p').text(text);
}

function changeNameChat(text){
	return $('.app .chat-dialog .chat-info .chat-text h4').html(escapeHtml(text) + ' <i class="fas fa-user-friends color-grey"></i>');
}

$('.app .chat-action .action-info button.close-action').on('click',(e)=>{
    $('.app .chat-action .action-menu button[target="#' + e.currentTarget.parentNode.id + '"]').click();    
});

$('.app .chat-action .action-menu button').on('click',(e)=>{

    var curId = $(e.currentTarget).attr('target');

    if($(e.currentTarget).hasClass('active')){
        $(e.currentTarget).removeClass('active');
        
        if(window.innerWidth < 1200){
            $('.app .chat-list').css('display','inline-block');
            $('.app .chat-list').animate({left: 0},200);
            $('.app .chat-dialog').animate({'margin-left': '303px'}, 200);
        }else{
            $('.app .chat-dialog').animate({width: (window.innerWidth - 403) +'px'}, 200);
        }
        $('.app .chat-action .action-info'+curId).animate({right: '-303px'},200,()=>{
            $('.app .chat-action .action-info'+curId).css('display','none');
        });

        return false;
    }

    for(var i = 0; i < $('.app .chat-action .action-menu button').length; i++){
        $($('.app .chat-action .action-menu button')[i]).removeClass('active');
    }

    $(e.currentTarget).toggleClass('active');

    if(window.innerWidth < 1200){
        $('.app .chat-list').animate({left: '-303px'},200, ()=>{
            $('.app .chat-list').css('display','none');
        });
        $('.app .chat-dialog').animate({'margin-left': 0}, 200);
    }else{
        $('.app .chat-dialog').animate({width: (window.innerWidth - 705) +'px'}, 200);
    }
    $('.app .chat-action .action-info'+curId).css('display','inline-block');
    $('.app .chat-action .action-info'+curId).animate({right: '60px'},200);

});

$('.app .chat-list .list-personal .profile-action .profile-chats button').on('click',(e)=>{
    for(var i = 0; i < $('.app .chat-list .list-personal .profile-action .profile-chats button').length; i++){
        $('i', $('.app .chat-list .list-personal .profile-action .profile-chats button')[i]).removeClass('active');
    }

    $('i', e.currentTarget).toggleClass('active');
});





$('.app .chat-action .action-info .todo-panel input').keyup(function () {
    var rex = new RegExp($(this).val(), 'i'); 	// create regex from value of input
    $('.app .chat-action .action-info .todo-list .todo-class-list li').hide();					// hide all
    $('.app .chat-action .action-info .todo-list .todo-class-list li').filter(function () {
        return rex.test($('.checkbox-text', this).text());		// show all that contain the text.
    }).show();
});

// Select top stack
$('.app .chat-action .action-info .todo-panel input').keypress(function(e){
    if(e.which == 13) {//Enter key pressed
        stack = $('.app .chat-action .action-info .todo-list .todo-class-list li').find('.checkbox-text:visible:first')
        stack.css('color', '#E65C3F')
        var href = stack.attr('href');
        $(location).attr('href',href);
    }
});

$(".photo-gallery").lightGallery({
    loop: false,
    speed: 250,
    addClass: 'lightbox-module',

    showThumbByDefault: false,
})
.on('onAfterOpen.lg', (e)=>{
    let newBtn = `
        <button type="button" style="font-family: 'Font Awesome 5 Pro'; font-size: 20px;" aria-label="Delete Image" id="delete-image" class="lg-icon fas fa-trash-alt"></button>
    `;
    $(".lg-toolbar").append(newBtn);

    
}); 


// const toggleButton = document.querySelector('.dark-light');
// const colors = document.querySelectorAll('.color');

// colors.forEach(color => {
//   color.addEventListener('click', (e) => {
//     colors.forEach(c => c.classList.remove('selected'));
//     const theme = color.getAttribute('data-color');
//     document.body.setAttribute('data-theme', theme);
//     color.classList.add('selected');
//   });
// });

// toggleButton.addEventListener('click', () => {
//   document.body.classList.toggle('dark-mode');
// });