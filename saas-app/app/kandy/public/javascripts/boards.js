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
    const sortable = new Sortable(
        document.querySelectorAll('.column'), {
            draggable: '.sortItem',
            delay: 0,
        }
    )

   sortable.on('sortable:start', () => {
        console.log('sortable:start');
    });

    sortable.on('sortable:sort', () => {
        console.log('sortable:sort');
    });

    sortable.on('sortable:sorted', () => {
        console.log('sortable:sorted');
    });

    sortable.on('sortable:stop', () => {
        setTimeout(updateListItems, 10);
        console.log('sortable:stop');
    });
});
