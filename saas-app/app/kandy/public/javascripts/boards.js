import Sortable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Sortable/Sortable.mjs';

document.addEventListener('DOMContentLoaded', function () {

    const columns = document.querySelectorAll('.sortable_column');
    const cards = document.querySelectorAll('.sortable_card');

    const sortable = new Sortable(
        cards, {
        draggable: '.sortCard',
        delay: 50,
        mirror: {
            constrainDimensions: true
        },
        distance: 5
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


    document.querySelectorAll('.card-details-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const form = event.target;
            const modalId = form.closest('.modal').id;
            const cardId = modalId.split('_').pop();
            const boardId = window.boardId
            const url = `/boards/${boardId}/${cardId}`;

            const formData = new FormData(form);
            const jsonData = {};
            formData.forEach((value, key) => { jsonData[key] = value; });

            fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    window.location.reload()
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
    });

    $('.new_card_modal').on('shown.bs.modal', function () {

        const boardId = window.boardId

        $.ajax({
            url: `/boards/${boardId}/labels`,
            method: 'GET',
            success: function (response) {
                console.log('Fetched labels:', response);
                // You can also manipulate the modal content here
            },
            error: function (xhr, status, error) {
                // Error handling
                console.error('Error fetching labels:', status, error);
            }
        });
    });

});
