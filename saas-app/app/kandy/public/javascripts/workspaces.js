$(document).ready(function () {
    $('.workspace-delete-form').submit(function (e) {
        e.preventDefault();
        e.stopPropagation();

        var workspaceId = this.id;
        console.log("Deleting workspace with ID:", workspaceId);

        $.ajax({
            url: `/workspaces/${workspaceId}`,
            type: 'DELETE',
            success: function () {
                console.log("Deleting successful.")
                window.location = self.location;
            }
        })
    })
});