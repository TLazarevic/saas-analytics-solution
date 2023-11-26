import Droppable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Draggable/Draggable.mjs';
import Draggable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Draggable/Draggable.mjs';
import Sortable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Sortable/Sortable.mjs';

document.addEventListener('DOMContentLoaded', function () {
    var options = {
        group: 'share',
        animation: 100
    };

    var el = document.getElementById('cards');
    // const draggable = new Draggable(document.querySelectorAll('tr'), {
    //     draggable: 'td',
    // });
    // const droppable = new Droppable(document.querySelectorAll('tbody'), {
    //     draggable: '.item',
    //     dropzone: 'tbody',
    // });
    const sortable = new Sortable(document.querySelectorAll('tbody'), {
        draggable: '.item',
    });

    var events = [
        'onChoose',
        'onStart',
        'onEnd',
        'onAdd',
        'onUpdate',
        'onSort',
        'onRemove',
        'onChange',
        'onUnchoose'
    ];

    events.forEach(function (name) {
        options[name] = function (evt) {
            console.log({
                'event': name,
                'this': this,
                'item': evt.item,
                'from': evt.from,
                'to': evt.to,
                'oldIndex': evt.oldIndex,
                'newIndex': evt.newIndex
            });
        };
    });
});
