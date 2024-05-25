$(document).ready(function () {

    var selectedIdsToInvite = new Set([]);

    $('.board-delete-form').submit(function (e) {
        e.preventDefault();
        e.stopPropagation();

        var boardId = this.id;
        console.log("Deleting board with ID:", boardId);

        $.ajax({
            url: `/boards/${boardId}`,
            type: 'DELETE',
            success: function () {
                console.log("Deleting successful.")
                window.location = self.location;
            }
        })
    })

    $('#searchBar').on('input', function () {
        var searchQuery = $(this).val().toLowerCase();

        $('#recommendationsList .list-group-item').each(function () {
            var itemId = this.id;
            if (!selectedIdsToInvite.has(itemId)) {
                $(this).hide();
            }
        });

        if (searchQuery.length >= 2) {
            fetch(workspace.id + "/search_users/" + searchQuery, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(data => data["users"].forEach(function (filteredMember) {
                    $('#recommendationsList .list-group-item').each(function () {
                        var itemId = this.id;
                        if (!selectedIdsToInvite.has(itemId)) {
                            $(this).remove();
                        }
                    });

                    if (!selectedIdsToInvite.has(filteredMember.id.toString())) {
                        $('#recommendationsList').append(`<li id=${filteredMember.id} class="list-group-item">${filteredMember.name} ${filteredMember.last_name}</li>`);
                    }
                }));
        }
    });

    $('#addMembersModal').on('hidden.bs.modal', function () {
        $('#searchBar').val('');
        $('#recommendationsList').empty();
    });

    $(document).on('click', '.list-group-item', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $(this).css('background-color', '');
            selectedIdsToInvite.delete(this.id);
        } else {
            $(this).addClass('selected');
            $(this).css('background-color', '#6fadc7');
            selectedIdsToInvite.add(this.id);
        }
    });

    $('#addMembersModal').on('hidden.bs.modal', function () {
        $('#searchBar').val('');
        $('#recommendationsList').empty();
        selectedIdsToInvite.clear();
    });

    $('#inviteMembers').on('click', function () {
        var workspaceId = $('#addMembersModal').data('workspace-id');

        data = JSON.stringify({ 'users': [...selectedIdsToInvite] });

        // todo: prevent selecting existing members

        $.ajax({
            url: `/workspaces/${workspaceId}/members`,
            type: 'PUT',
            data: data,
            contentType: 'application/json',
            success: function () {
                console.log("Adding members successful.")
                window.location = self.location;
            },
            error: function (xhr) {
                console.log("Adding members failed.")
                if (xhr.status === 400) {
                    $('#message').text(xhr.responseJSON.error);
                } else {
                    $('#message').text('An unexpected error occurred');
                }
            }
        })
    })

    $('#board-form').submit(function (e) {
        e.preventDefault();
        e.stopPropagation();

        var workspaceId = workspace.id;
        var formData = $(this).serialize();

        console.log("Creating a board in workspace:", workspaceId);

        $.ajax({
            url: `/boards/${workspaceId}`,
            type: 'POST',
            data: formData,
            success: function () {
                console.log("Board created successfuly.")
                window.location.reload();
            },
            error: function (xhr) {
                if (xhr.status === 400) {
                    $('#message').text(xhr.responseJSON.error);
                } else {
                    $('#message').text('An unexpected error occurred');
                }
            }
        })
    })

});


