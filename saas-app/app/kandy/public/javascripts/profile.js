$(document).ready(function () {
    $('#delete-acc').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: `/users/delete`,
            type: 'PUT',
            success: function (response) {
                window.location.replace(response.url);
            },
            error: function (xhr) {
                console.log("Error deleting user.");
            }
        });
    });
});
