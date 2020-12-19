let addInput = $('.app .chat-action .action-info .todo-list .todo-add input.input-style');
let addBtn = $('.app .chat-action .action-info .todo-list .todo-add button');
let todoList = $('.app .chat-action .action-info .todo-list .todo-class#ToDos-' + addBtn.data('target') + ' .todo-class-list')



$('.app .chat-action .action-info .todo-list .todo-add .checkbox input').on('change', (e)=>{
    let checked = e.target.checked;
    if(checked){
        $('.app .chat-action .action-info .todo-list .todo-add-panel').css('display', 'block');
        $('.app .chat-action .action-info .todo-list .todo-class-list').css('max-height', 'calc(50vh + 33px)');
    }else{
        $('.app .chat-action .action-info .todo-list .todo-add-panel').css('display', 'none');
        $('.app .chat-action .action-info .todo-list .todo-class-list').css('max-height', 'calc(50vh + 85px)');
    }
});


let todos = JSON.parse(localStorage.getItem('app-todos')) || [];

function addItem() {
    let newItem = addInput.val();
    if (newItem == '') {
        return;
    }
    let now = new Date();
    let day = now.getDate() < 10 ? '0'+now.getDate() : now.getDate();
    let mounth = (now.getMonth()+1) < 10 ? '0'+(now.getMonth()+1) : (now.getMonth()+1);
    todos.push({
        title: newItem,
        time: day + '.' + mounth + '.' + now.getFullYear(),
        checked: false
    });
    saveItems(todos);
    renderList();
    addInput.val('');
}

function removeItem(id) {
    todos.splice(id, 1);
    saveItems(todos);
    return todos;
}

function toogleItem(id) {
    todos[id].checked = !todos[id].checked;
    if(todos[id].checked){
        $('li#' + id + ' .todo-delete').css('display','block');
    }else{
        $('li#' + id + ' .todo-delete').css('display','none');
    }
    saveItems(todos);
}

function saveItems(todos) {
    localStorage.setItem('app-todos', JSON.stringify(todos));
}

function renderList() {
    todoList.html('');
    todos.forEach(function(el, i) {
        let li = document.createElement('li');
        li.className = 'todo-item';
        let checked = el.checked ? 'checked="checked"' : '';
        li.id = i;
        li.innerHTML = `
            <label class="checkbox">
                <input type="checkbox" ${checked}>
                <span class="checkbox-icon"></span>
                <span class="checkbox-text">${el.title}</span>
            </label>
            <small>${el.time}</small>
            <button class="todo-delete btn"><i class="far fa-times-hexagon"></i></button>
        `;

        if (el.checked) {
            $('.checkbox-text', li).addClass('checked');
            $('.todo-delete', li).css('display', 'block');
        }else{
            $('.checkbox-text', li).removeClass('checked');
            $('.todo-delete', li).css('display', 'none');
        }

        todoList.append(li);
    });
    removeCheckbox();
    toggleCheckbox();
}

// Add Item
addBtn.on('click', (e)=>{ 
   addItem(); 
});

// Remove Item
function removeCheckbox(){
  $('.app .chat-action .action-info .todo-list .todo-class-list li .todo-delete').on('click', (e)=>{
    let parent = e.target.parentNode;
    let id = parent.id;
    removeItem(id);
    renderList();
});
}

// Toggle Item
function toggleCheckbox(){
$('.app .chat-action .action-info .todo-list .todo-class-list li .checkbox input').on('change', (e)=>{
    let li = e.target.parentNode.parentNode;
    let id = li.id;
    toogleItem(id);
    renderList();
});
  
$('.app .chat-action .action-info .todo-list .todo-class-list li').on('click', (e)=>{
  let that = e.currentTarget; 
  if(e.target != that.children[2]){
        $('.checkbox input', that).click();
  }
});
}

renderList();


$('.app .chat-action .action-info .todo-list .todo-class').on('click',(e)=>{
    if(e.target == e.currentTarget || e.target == e.currentTarget.children[0] || e.target == e.currentTarget.children[1]){
        $(e.currentTarget.children[2]).slideToggle(300);
    }
});