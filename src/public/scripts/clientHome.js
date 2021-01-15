$("#createRoom").on("click", () => {
    if ($("#name")[0].reportValidity()) {
        window.location.href = "/api/createRoom?name="+$("#name").val();
    }
});

$("#joinRoom").on("click", () => {
    let roomIDValidity = $("#roomID")[0].reportValidity();
    let nameValidity = $("#name")[0].reportValidity();

    if (roomIDValidity && nameValidity) {
        let roomID = $('#roomID').val();
        let name = $('#name').val();

        window.location.href = `/rooms/${roomID}?name=${name}`;
    }
});