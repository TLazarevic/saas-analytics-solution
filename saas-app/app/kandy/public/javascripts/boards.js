import Sortable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Sortable/Sortable.mjs';

document.addEventListener('DOMContentLoaded', function () {

    const columns = document.querySelectorAll('.sortable_column');
    const cards = document.querySelectorAll('.sortable_card');

    const sortable = new Sortable(
        cards, {
        draggable: '.sortCard',
        delay: 200,
        mirror: {
            constrainDimensions: true
        },
    }
    )

    const sortableColumn = new Sortable(
        columns, {
        draggable: '.sortColumn',
        handle: ".column_header",
        delay: 0,
        mirror: {
            constrainDimensions: true
        },
    }
    )

    sortableColumn.on('sortable:stop', async (event) => {

        let columnId = event.data.dragEvent.data.source.id
        let newPosition = event.newIndex
        let boardId = window.boardId

        try {
            let response = null
            let body = null

            body = JSON.stringify({ 'position': newPosition })

            response = await fetch(`/boards/${boardId}/column/${columnId}/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body
            });

            if (response.ok) {
                console.log('Column updated successfully');
            } else {
                console.error('Failed to update column:', response.message);
                // TODO Update UI
            }
        } catch (error) {
            console.error('Error during update:', error);
            // TODO Update UI
        }

    });

    sortable.on('sortable:stop', async (event) => {

        let cardId = event.data.dragEvent.data.source.id
        let prevColumnId = event.oldContainer.id
        let newColumnId = event.newContainer.id
        let newPosition = event.newIndex
        let boardId = window.boardId

        try {
            let response = null
            let body = null

            if (prevColumnId !== newColumnId) {
                body = JSON.stringify({ 'columnId': newColumnId, 'position': newPosition })
            }
            else {
                body = JSON.stringify({ 'position': newPosition })
            }

            response = await fetch(`/boards/${boardId}/column/${prevColumnId}/card/${cardId}/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body
            });

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
    });

    document.querySelectorAll('.cards').forEach(trigger => {
        console.log('aaa')
        trigger.addEventListener('click', function () {
            console.log('bbb')
            var targetId = this.getAttribute('data-bs-target');
            var modal = new bootstrap.Modal(document.querySelector(targetId));
            modal.show();
        });
    });
});
