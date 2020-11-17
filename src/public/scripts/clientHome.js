$("#createRoom").on("click", () => {
    $.ajax({
        url: "/api/createRoom",
        success: (result) => {
            window.location.href = `/${result}`;
        },
    });
});