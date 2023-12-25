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

    sortable.on('sortable:stop', (event) => {
        //setTimeout(updateListItems, 10);
        console.log(event);
        console.log(event.originalSource.parentNode.id); // return current col id
        let oldColumnId = event.oldContainer.id
        let newColumnId = event.newContainer.id
        if (oldColumnId !== newColumnId) {
            try {
                const response = fetch(`/${boardId}/column/${oldColumnId}/card/${cardId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ columnId: newColumnId }),
                });
                const result = response.json();

                if (result.success) {
                    console.log('Row updated successfully');
                } else {
                    console.error('Failed to update row:', result.message);
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
