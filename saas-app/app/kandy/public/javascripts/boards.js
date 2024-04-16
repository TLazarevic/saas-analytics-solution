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
            console.log(jsonData)
            console.log()

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
            const selectedLabelsContainer = this.closest('.modal').querySelector('.selectedLabels');
            const labelToRemove = this.closest('.selected-label');
            const labelName = labelToRemove.querySelector('.label-name').textContent;
            //selectedLabelsContainer.removeChild(labelToRemove);

            console.log(event.target)
            let labelId = labelToRemove.dataset.labelId;
            console.log('aaaa')
            console.log(labelId)
            toggleLabelSelection(modal, labelName, labelId, event.target);

        });
    })

    document.querySelectorAll('.new_card_modal,  .card-details-modal').forEach(modal => {

        const dropdownButton = modal.querySelector('.dropdownLabelButton');

        var dropdownElement = new bootstrap.Dropdown(dropdownButton);

        dropdownButton.addEventListener('click', function (event) {
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
                        labelDiv.dataset.labelId = label.id;

                        dropdownMenu.appendChild(labelDiv);
                    }
                    dropdownElement.toggle();
                },
                error: function (xhr, status, error) {
                    console.error('Error fetching labels:', status, error);
                }
            });
        });

        modal.querySelector('.dropdown-menu').addEventListener('click', function (event) {
            if (event.target.matches('.dropdown-item')) {
                let labelName = event.target.textContent;
                let labelId = event.target.dataset.labelId;
                toggleLabelSelection(modal, labelName, labelId, event.target);
            }
        });
    });

    function toggleLabelSelection(modal, labelName, labelId, dropdownItem) {
        const selectedLabelsContainer = modal.querySelector('.selectedLabels');
        const form = modal.querySelector('form');
        const existingLabel = Array.from(selectedLabelsContainer.children).find(label => label.dataset.labelId == labelId);

        console.log(labelName)
        console.log(selectedLabelsContainer)

        console.log('Entering if')
        console.log(Array.from(selectedLabelsContainer.children)); // To see what children are present
        console.log(labelId); // To check the value of labelId being compared

        if (existingLabel) {
            console.log('Existing label')
            selectedLabelsContainer.removeChild(existingLabel);
            dropdownItem.classList.remove('selected');

            const inputToRemove = form.querySelector(`input[name="selectedLabels[]"][value="${labelId}"]`);
            console.log(labelName)
            console.log(labelId)
            console.log(inputToRemove);
            console.log(form)
            let formdata = new FormData(form)
            for (let [key, value] of formdata.entries()) {
                console.log(`${key}: ${value}`);
            }
            inputToRemove.parentNode.removeChild(inputToRemove);


            console.log(inputToRemove)
        } else {
            console.log('Creating new selected label')
            let newLabel = document.createElement('div');
            newLabel.className = 'label selected-label';
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
            console.log(hiddenInput.value)
            form.appendChild(hiddenInput);

            let formdata = new FormData(form)
            for (let [key, value] of formdata.entries()) {
                console.log(`${key}: ${value}`);
            }
            console.log(modal.querySelectorAll('[name="selectedLabels[]"]'))

            dropdownItem.classList.add('selected');
        }
    }

});
