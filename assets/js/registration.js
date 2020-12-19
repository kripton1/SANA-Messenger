
function closeLogin(irl = false){
    setTimeout(()=>{
        $(".authent").show().animate({right:90},{easing : 'easeOutQuint' ,duration: 600, queue: false });
        $(".authent").animate({opacity: 0},{duration: 200, queue: false }).addClass('visible');
        $('.login').removeClass('body-b');
        setTimeout(()=>{
            $('.login').removeClass('body-a');
            $(".authent").hide(0);
            if(irl){
                $('.login div').fadeOut(123);
                setTimeout(()=>{
                    $('.success').fadeIn();
                    setTimeout(()=>{
                        window.location.href = "login";
                    },1400);
                },400);
            }
        },300);
    },700);
}

$('input[type="submit"]').click(()=>{
    $('.login').addClass('body-a')
    setTimeout(()=>{
        $('.login').addClass('body-b')
    },300);
    setTimeout(()=>{
        $(".authent").show().animate({right:-320},{easing : 'easeOutQuint' ,duration: 600, queue: false });
        $(".authent").animate({opacity: 1},{duration: 200, queue: false }).addClass('visible');

        var name = $('div.login_fields__user input[name="name"]'),
            lastname = $('div.login_fields__user input[name="lastname"]'),
            email = $('div.login_fields__user input[name="email"]'),
            password = $('div.login_fields__password input[name="password"]'),
            repeatpassword = $('div.login_fields__password input[name="repeatpassword"]');

        if(name.val() == '' || email.val() == '' || password.val() == '' || repeatpassword.val() == ''){
            closeLogin();
            $('.login_error').fadeIn(123);
            $('.login_error').text('Fill in all required fields!');
            return false;
        }
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(String(email.val()).toLowerCase())){
            closeLogin();
            $('.login_error').fadeIn(123);
            $('.login_error').text('Email isn\'t correct!');
            return false;
        }

        if(password.val() != repeatpassword.val()){
            closeLogin();
            $('.login_error').fadeIn(123);
            $('.login_error').text('Passwords don\'t match!');
            return false;
        }

        var req = {
            name: name.val(),
            lastname: lastname.val(),
            email: email.val(),
            password: encrypt(password.val(), key)
        };

        $.ajax({
            type: 'GET',
            url: 'API/createUser/TestToken/' + JSON.stringify(req),
            cache: false,
            crossDomain: true,
            contentType: 'application/json',
            dataType: 'json',
            success: (body)=>{
                console.log(body);
                if(body.result == 'success'){
                    closeLogin(true);
                    return true;
                }else{
                    closeLogin();
                    $('.login_error').fadeIn(123);
                    if(body.error != ''){
                        $('.login_error').text(body.error);
                    }else{
                        $('.login_error').text('Error connection!');
                    }
                    return false;
                }
            }

        });
    },500);
});

$('input[type="text"],input[type="password"]').focus((e)=>{
    $(e.currentTarget).prev().animate({'opacity':'1'},200)
});
$('input[type="text"],input[type="password"]').blur((e)=>{
    $(e.currentTarget).prev().animate({'opacity':'.5'},200)
});

$('input[type="password"][name="password"]').keyup((e)=>{
    if($(e.currentTarget).val() != ''){
        $(e.currentTarget).next().animate({'opacity':'1','right' : '30'},200);
        $(e.currentTarget).next().children().attr('class', 'far fa-clock');
        $(e.currentTarget).next().css('color','rgb(175, 177, 190)');
        $(e.currentTarget).next().attr('title', 'Loading... Please wait.');
        clearTimeout(requestTimeout);
        requestTimeout = setTimeout(()=>{
            passwordmodified(e.currentTarget, (res)=>{
                if(res){
                    $(e.currentTarget).next().children().attr('class', 'far fa-times-circle');
                    $(e.currentTarget).next().css('color','#e85555');
                    $(e.currentTarget).next().attr('title', 'Bad password! May be hacked!');
                }else{
                    $(e.currentTarget).next().children().attr('class', 'far fa-check');
                    $(e.currentTarget).next().css('color','#5abd6b');
                    $(e.currentTarget).next().attr('title', 'Good password!');
                }
            });
        }, 300);
    }else{
        $(e.currentTarget).next().animate({'opacity':'0','right' : '20'},200)
    }
});

var open = 0;
$('.tab').click((e)=>{
    $(e.currentTarget).fadeOut(200,()=>{
        $(e.currentTarget).parent().animate({'left':'0'})
    });
});

particlesJS('particles-js', {
    'particles': {
        'number': {
            'value': 80,
            'density': {
                'enable': true,
                'value_area': 800
            }
        },
        'color': { 'value': '#58fb40' },
        'shape': {
            'type': 'circle',
            'stroke': {
                'width': 0,
                'color': '#000000'
            },
            'polygon': { 'nb_sides': 5 },
            'image': {
                'src': 'img/github.svg',
                'width': 100,
                'height': 100
            }
        },
        'opacity': {
            'value': 0.5,
            'random': false,
            'anim': {
                'enable': false,
                'speed': 1,
                'opacity_min': 0.1,
                'sync': false
            }
        },
        'size': {
            'value': 3,
            'random': true,
            'anim': {
                'enable': false,
                'speed': 40,
                'size_min': 0.1,
                'sync': false
            }
        },
        'line_linked': {
            'enable': true,
            'distance': 150,
            'color': '#5abd6b',
            'opacity': 0.4,
            'width': 1
        },
        'move': {
            'enable': true,
            'speed': 6,
            'direction': 'none',
            'random': false,
            'straight': false,
            'out_mode': 'out',
            'bounce': false,
            'attract': {
                'enable': false,
                'rotateX': 600,
                'rotateY': 1200
            }
        }
    },
    'interactivity': {
        'detect_on': 'canvas',
        'events': {
            'onhover': {
                'enable': true,
                'mode': 'grab'
            },
            'onclick': {
                'enable': true,
                'mode': 'push'
            },
            'resize': true
        },
        'modes': {
            'grab': {
                'distance': 140,
                'line_linked': { 'opacity': 1 }
            },
            'bubble': {
                'distance': 400,
                'size': 40,
                'duration': 2,
                'opacity': 8,
                'speed': 3
            },
            'repulse': {
                'distance': 200,
                'duration': 0.4
            },
            'push': { 'particles_nb': 4 },
            'remove': { 'particles_nb': 2 }
        }
    },
    'retina_detect': true
});