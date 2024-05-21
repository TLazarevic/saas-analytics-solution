import Sortable from 'https://cdn.jsdelivr.net/npm/@shopify/draggable/build/esm/Sortable/Sortable.mjs';

document.addEventListener('DOMContentLoaded', function () {

    const columns = document.querySelectorAll('.sortable_column');
    const cards = document.querySelectorAll('.sortable_card');
    const paleColors = window.paleColors

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
        delay: 50,
        mirror: {
            constrainDimensions: true
        },
        distance: 5
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

    document.querySelectorAll('#new-card-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const form = event.target;
            const url = form.action

            const formData = new FormData(form);
            const jsonData = {};
            formData.forEach((value, key) => {
                if (jsonData.hasOwnProperty(key)) {
                    if (!Array.isArray(jsonData[key])) {
                        jsonData[key] = [jsonData[key]];
                    }
                    jsonData[key].push(value);
                } else {
                    jsonData[key] = value;
                }
            });

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Card created successfully');
                        window.location.reload();
                    } else {
                        if (response.status === 400) {
                            $('#message').text(xhr.responseJSON.error);
                        } else {
                            $('#message').text(xhr.responseJSON.error);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Failed to create card.', error);
                });
        });
    });

    document.querySelectorAll('.card-details-form').forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const form = event.target;
            const modalId = form.closest('.modal').id;
            const cardId = modalId.split('_').pop();
            const boardId = window.boardId
            const url = `/boards/${boardId}/card/${cardId}`;

            const formData = new FormData(form);
            const jsonData = {};
            formData.forEach((value, key) => {
                if (jsonData.hasOwnProperty(key)) {
                    if (!Array.isArray(jsonData[key])) {
                        jsonData[key] = [jsonData[key]];
                    }
                    jsonData[key].push(value);
                } else {
                    jsonData[key] = value;
                }
            });

            fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Row updated successfully');
                    } else {
                        console.error('Failed to update row:', response.message);
                    }
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

    document.querySelectorAll('.deselect-label').forEach(button => {
        button.addEventListener('click', function (event) {
            const modal = this.closest('.modal')
            const labelToRemove = this.closest('.selected-label');
            const labelName = labelToRemove.querySelector('.label-name').textContent;

            let labelId = labelToRemove.dataset.labelId;
            toggleLabelSelection(modal, labelName, labelId, event.target);

        });
    })


    document.querySelectorAll('.archive-card-btn').forEach(btn => {
        btn.addEventListener('click', function (event) {
            event.preventDefault();

            const modalId = event.target.closest('.modal').id;
            const cardId = modalId.split('_').pop();
            const boardId = window.boardId;
            const url = `/boards/${boardId}/${cardId}`;

            fetch(url, {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Card archived successfully');
                    } else {
                        console.error('Failed to archive card:', response.message);
                    }
                })
                .then(data => {
                    console.log('Success:', data);
                    window.location.reload()
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
    })

    document.querySelectorAll('.archive-column').forEach(btn => {
        btn.addEventListener('click', function (event) {
            event.preventDefault();

            const columnId = event.target.closest('.sortable_card').id;
            const boardId = window.boardId;
            const url = `/boards/${boardId}/column/${columnId}`;

            fetch(url, {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Column archived successfully');
                    } else {
                        console.error('Failed to archive column:', response.message);
                    }
                })
                .then(data => {
                    console.log('Success:', data);
                    window.location.reload()
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
    })

    document.querySelectorAll('.editable.card-name-details').forEach(editableSpan => {

        editableSpan.addEventListener('click', function () {
            this.contentEditable = "true";
            this.focus();
        });

        editableSpan.addEventListener('blur', function () {
            this.contentEditable = "false";

            const modalId = event.target.closest('.modal').id;
            const cardId = modalId.split('_').pop();
            const boardId = window.boardId;
            const url = `/boards/${boardId}/card/${cardId}/rename`;

            fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "name": this.textContent }),
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Row updated successfully');
                    } else {
                        console.error('Failed to update row:', response.message);
                    }
                })
                .then(data => {
                    console.log('Success:', data);
                    window.location.reload()
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });

        editableSpan.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });

    document.querySelectorAll('.editable.column-name').forEach(editableSpan => {

        editableSpan.addEventListener('dblclick', function () {
            this.contentEditable = "true";
            this.focus();
        });

        editableSpan.addEventListener('blur', function (event) {
            this.contentEditable = "false";

            const columnId = event.target.closest('.sortable_card').id;
            const boardId = window.boardId;
            const url = `/boards/${boardId}/column/${columnId}/rename`;

            fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "name": this.textContent }),
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Column renamed successfully');
                    } else {
                        console.error('Failed to rename column:', response.message);
                    }
                })
                .then(data => {
                    console.log('Success:', data);
                    window.location.reload()
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });

        editableSpan.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });

    document.querySelectorAll('.new_card_modal,  .card-details-modal').forEach(modal => {

        const dropdownButton = modal.querySelector('.dropdownLabelButton');

        var dropdownElement = new bootstrap.Dropdown(dropdownButton);

        dropdownButton.addEventListener('click', function (_event) {
            const boardId = window.boardId;
            let dropdownMenu = dropdownButton.nextElementSibling;
            dropdownMenu.innerHTML = '';

            $.ajax({
                url: `/boards/${boardId}/labels`,
                method: 'GET',
                success: function (response) {
                    for (const label of response.labels) {
                        let labelDiv = document.createElement('div');
                        labelDiv.className = 'dropdown-item';
                        labelDiv.textContent = label.name;
                        labelDiv.dataset.color = label.color;
                        labelDiv.dataset.labelId = label.id;

                        dropdownMenu.appendChild(labelDiv);
                    }
                    dropdownElement.toggle();
                },
                error: function (_xhr, status, error) {
                    console.error('Error fetching labels:', status, error);
                }
            });
        });

        modal.querySelector('.dropdown-menu').addEventListener('click', function (event) {
            if (event.target.matches('.dropdown-item')) {
                let labelName = event.target.textContent;
                let labelId = event.target.dataset.labelId;
                let labelColor = event.target.dataset.color;
                toggleLabelSelection(modal, labelName, labelColor, labelId, event.target);
            }
        });
    });

    function toggleLabelSelection(modal, labelName, labelColor, labelId, dropdownItem) {
        const selectedLabelsContainer = modal.querySelector('.selectedLabels');
        const form = modal.querySelector('form');
        const existingLabel = Array.from(selectedLabelsContainer.children).find(label => label.dataset.labelId == labelId);

        if (existingLabel) {
            selectedLabelsContainer.removeChild(existingLabel);
            dropdownItem.classList.remove('selected');

            const inputToRemove = form.querySelector(`input[name="selectedLabels[]"][value="${labelId}"]`);
            inputToRemove.parentNode.removeChild(inputToRemove);

        } else {

            let newLabel = document.createElement('div');
            newLabel.className = 'label selected-label';
            newLabel.style = `background-color: ${paleColors[labelColor]}`
            newLabel.textContent = labelName;
            newLabel.dataset.labelId = labelId;

            let deselectBtn = document.createElement('span');
            deselectBtn.textContent = ' x';
            deselectBtn.className = 'deselect-label';
            deselectBtn.onclick = () => { selectedLabelsContainer.removeChild(newLabel); form.removeChild(form.querySelector(`input[name="selectedLabels[]"][value="${labelId}"]`)); };

            newLabel.appendChild(deselectBtn);
            selectedLabelsContainer.appendChild(newLabel);

            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'selectedLabels[]';
            hiddenInput.value = labelId;
            form.appendChild(hiddenInput);

            dropdownItem.classList.add('selected');
        }
    }

    $('#new-label-form').submit(function (e) {
        e.preventDefault();

        var formData = $(this).serializeArray();
        var jsonObject = {};

        $.map(formData, function (n, _i) {
            jsonObject[n['name']] = n['value'];
        });

        $.ajax({
            url: $(this).attr('action'),
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(jsonObject),
            success: function (data) {
                console.log('Success');
            },
            error: function (error) {
                console.error('Error:', error);
            }
        });

    })
});
