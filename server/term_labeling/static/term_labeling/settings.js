/*
this js file to handle the settings page.
 */

function toggle_body(id) {
    // show/hide tab by id
  const header = document.getElementById(id);
  const body = header.nextElementSibling;
  $(body).toggle();
}

$(document).ready(function () {
     $('#myinfo').on('shown.bs.modal', function (e) {
                // create info modal for settings page.
                modal = document.getElementById("myinfo")
                body = modal.getElementsByClassName('modal-body')[0];
                body.innerHTML = "<ul><li>Click on users to manage users accounts and details.</li>"
                +"<li>databases management have 3 buttons<ul><li>Sync poems: fetching the new poems from a previous project database and create data for statistics purposes</li>"
                +"<li>Backup Database: save currently tags and thier relations in a file and place it somewhere in the server disk</li>"
                +"<li>Restore Database : restore the database from a saved file , <span style=\"color: red\">WARNING</span>:you will lose all unsaved data </li></ul></li>"
                +"<li>Click on history icon to show your previous accessed poems.</li></ul>"
     });
});