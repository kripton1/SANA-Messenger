
function closeLogin(irl = false, app = '.app:not(.app2, .app3)'){
    setTimeout(()=>{
        $(app + " .authent").show().animate({right:90},{easing : 'easeOutQuint' ,duration: 600, queue: false });
        $(app + " .authent").animate({opacity: 0},{duration: 200, queue: false }).addClass('visible');
        $(app + ' .login').removeClass('body-b');
        setTimeout(()=>{
            $(app + ' .login').removeClass('body-a');
            $(app + " .authent").hide(0);
            if(irl){
                $(app + ' .login div').fadeOut(123);
                setTimeout(()=>{
                    $(app + ' .success').fadeIn();
                    setTimeout(()=>{
                        window.location.href = "index.html";
                    },1400);
                },400);
            }
        },300);
    },700);
}

$('input[name="password"]').focus();


$('input[type="text"],input[type="password"]').focus((e)=>{
	$(e.currentTarget).prev().animate({'opacity':'1'},200)
});
$('input[type="text"],input[type="password"]').blur((e)=>{
	$(e.currentTarget).prev().animate({'opacity':'.5'},200)
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