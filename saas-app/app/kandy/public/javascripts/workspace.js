$(document).ready(function () {
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
});