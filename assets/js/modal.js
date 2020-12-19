// var modal = document.querySelector("#modal");
// var modalOverlay = document.querySelector("#modal-overlay");
// var closeButton = document.querySelector("#close-button");
// var openButton = document.querySelector("#open-button");

// closeButton.addEventListener("click", function() {
//     modal.classList.toggle("closed");
//     modalOverlay.classList.toggle("closed");
// });

// openButton.addEventListener("click", function() {
//     modal.classList.toggle("closed");
//     modalOverlay.classList.toggle("closed");
// });


let modal = $('.modal');

for(let i = 0; i < modal.length; i++){
    let thisModal = modal[i];
    let overlayModal = $('#'+ thisModal.id + '-overlay');

    $(overlayModal).on('click', (e)=>{
        if(e.target == e.currentTarget){
            $(thisModal).fadeOut(250);
            $(overlayModal).fadeOut(250);
        }
    });

    $('[data-target="#' + thisModal.id + '"]').on('click', (e)=>{
        if(e.target == e.currentTarget){
            $(thisModal).fadeIn(150);
            $(overlayModal).fadeIn(150);
        }
    });

    $('button.close-button', thisModal).on('click', (e)=>{
        $(thisModal).fadeOut(250);
        $(overlayModal).fadeOut(250);   
    });

}



$('.modal .modal-guts .main .tab').on('click', (e)=>{
    let tabId = $(e.currentTarget).data('target');
    $('.modal .modal-guts .main .tab').removeClass('active');
    $(e.currentTarget).addClass('active');
    $('.modal .modal-guts .main .tab-body').hide(0);
    $('.modal .modal-guts .main .tab-body' + tabId).fadeIn(250);
});