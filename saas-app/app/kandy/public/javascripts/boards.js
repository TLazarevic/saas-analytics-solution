import Sortable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Sortable/Sortable.mjs';

document.addEventListener('DOMContentLoaded', function () {

    const sortable = new Sortable(
        document.querySelectorAll('.sortable_column'), {
            draggable: '.sortItem',
            delay: 0,
            mirror: {
              constrainDimensions: true,
            },
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

    sortable.on('sortable:stop', (evt) => {
        //setTimeout(updateListItems, 10);
        console.log('sortable:stop');
    });
});
