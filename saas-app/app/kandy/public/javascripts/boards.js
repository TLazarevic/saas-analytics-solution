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
        let prevColumnId = event.oldContainer.id
        let newColumnId = event.newContainer.id
        let newPosition = event.newIndex
        let prevPosition = event.oldIndex
        let boardId = window.location.href.split('/')[4];

        console.log(prevColumnId)
        console.log(newColumnId)
        console.log(newPosition)
        console.log(boardId)
        console.log(`${boardId}/column/${prevColumnId}/card/${cardId}/move`)
        if (prevColumnId !== newColumnId) {
            try {
                const response = await fetch(`${boardId}/column/${prevColumnId}/card/${cardId}/move`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 'columnId': newColumnId, 'position': newPosition, 'previousPosition': prevPosition }),
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
