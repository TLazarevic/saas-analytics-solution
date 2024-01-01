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

    sortable.on('sortable:stop', async (event) => {
        console.log(event);
        //setTimeout(updateListItems, 10);
        let cardId = event.data.dragEvent.data.source.id
        let oldColumnId = event.oldContainer.id
        let newColumnId = event.newContainer.id
        let newPosition = event.newIndex
        let boardId = window.location.href.split('/')[4];

        console.log(oldColumnId)
        console.log(newColumnId)
        console.log(newPosition)
        console.log(boardId)
        console.log(`${boardId}/column/${oldColumnId}/card/${cardId}/move`)
        if (oldColumnId !== newColumnId) {
            try {
                const response = await fetch(`${boardId}/column/${oldColumnId}/card/${cardId}/move`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 'newColumnId': newColumnId, 'position': newPosition }),
                });

                console.log(response)

                if (response.ok) {
                    console.log('Row updated successfully');
                } else {
                    console.error('Failed to update row:', response.message);
                    // TODO Update UI
                }
            } catch (error) {
                console.error('Error during update:', error);
                // TODO Update UI
            }
        }

        console.log('sortable:stop');
    });
});
