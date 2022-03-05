/*
this js file to handle the home page.
 */

$(document).ready(function () {
     $('#myinfo').on('shown.bs.modal', function (e) {
            modal = document.getElementById("myinfo")
            body = modal.getElementsByClassName('modal-body')[0];
            body.innerHTML = "<h3 style=\"text-align:center;\">Welcome to WTCAP</h3><br><ul><li>Use the Menubar to move between pages.</li><li> Guests have restriction ,Please contact the owner for more details.</li>"
            +"<li>You can see all your history in history section</li>"
            +"<li>Admin can see the last 100 entries of all users history</li>"
            +"<li>Click on any entries to redirect to poem tag page</li>"
            +"<li>Click on history icon to show your previous accessed poems.</li></ul>"
     });
     table = $('#listTable').DataTable( {
        responsive: true,
        pageLength: 10,
         columns: [
            { title: "المستخدم" },
            { title: "القصيدة" },
            { title: "الشاعر" },
            { title: "آخر تعديل" },
        ]
    } );
});