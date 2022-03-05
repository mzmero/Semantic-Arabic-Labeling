/*
this js file to handle the poem tag page.
 */
// ################################ global parameters ################################

let selected_term = ""; // the clicked term name by
let selected_obj = ""; // the clicked term obj in html
let right_clicked = ""; //The term we right clicked and open a menu for - the term we need the definition of
let right_clicked_line = 0; //The line of the right clicked term
let orange = "rgb(255, 165, 0)";
let tagParent = ""; // the selected tag in the hierarchy
let depth = 0;     // our current depth in the hierarchy , default is 0 when only roots are shown
let all_tags = []; // all tags in the db.
let viz;  // object to present the graph in currents tags of current poem
let poemID; // this poem id
let myUL;  // search bar ul
let tagged_terms_list; // all tagged terms in this poem
let suggested_term_list; // all terms that have a suggestion tags in this poem
let allroots; // all roots for all words
let table  // table object
let Excel // all tags in current poem to be used to download as excel file.
let ul1; // second layer of the hierarchy tree
let ul2; // third layer of the hierarchy
let rightclicked = ""; // right clicked tag from the hierarchy
let second_term = ""; // second term for merging terms
let merging = false; // in case merging is true or merging is false , default false.
let full_term = ""; // full term of two merging terms ,a + b = ab
let flag = false ; //flag false mean we're not returning to all roots , true mean w'ere returning to all roots if the tag have no parent

// ################################ end of parameters section ################################

$(document).ready(function () {
/*
only when document ready , do all required functions.
*/
    // get all roots
    getHeaders();
    // get poem_id
    const obj = document.getElementById("poem_id");
    poemID = obj.innerText;
    obj.remove();
    myUL = document.getElementById('myUL');
    $(document).click(function (e) {
            // on document click check if tags search bar is open and close it
        if ($('#tagsDropDown').is(':visible') && e.target.id !== "mySearchInput" && e.target.className !== "dropdownbox") {
            $('#tagsDropDown').hide();
        }
    });
       // save all tags for fuzzy search purpose
      document.querySelectorAll(".dropdownbox").forEach(function (d, i) {
            all_tags.push(d.innerText.trim())
       });
    get_words_analyzation(poemID).done(function (d) {
        // analyze the poem words and color it using this rules , save currently tagged terms and suggested term in global
        tagged_terms_list = d.tagged;
        suggested_term_list = d.suggested;
        // green color for a tagged term , blue color for suggested term
        tagged_terms_list.forEach(function (d) {
            const id = d.row + "_" + d.sader + "_" + d.position;
            document.getElementById(id).style.color = "green"
        });
        suggested_term_list.forEach(function (d) {
            if (!tagged_terms_list.some(item => item.row === d.row && item.sader === d.sader && item.position === d.position)) {
                const id = d.row + "_" + d.sader + "_" + d.position;
                document.getElementById(id).style.color = "blue"
            }
        });
        // save all roots of words
        allroots = d.roots;
        tooltips = $('.term').tooltip();
        // add tooltip for each term that's show the root
        tooltips.each(function (ndx, elem) {
            $(elem).attr('title', allroots[elem.innerHTML.trim()])
                .tooltip('_fixTitle')
        })
    });
    // in page loading , show only third container
    $("#collapseOne").collapse('hide');
    $("#collapseThree").collapse('show');
    // init table for all tags
    table = $('#TaglistTable').DataTable( {
        responsive: true,
         columns: [
            { title: "#" },
            { title: "Tag" },
            { title: "Frequency" },
            { title: "Percent of Total" },
        ]
    } );
        // tooltip for each button
       $('.btn').tooltip({
            trigger:'hover'
        });
    $(".term").click(function () {
        //when client click on a term , check prev clicked term and adjust its color
        if (selected_obj !== "" && selected_obj.css("color") === orange) {
            const properties = selected_obj.attr('id').split('_').map(x => +x);
               // if prev term is tagged , color it again with green.
            if (tagged_terms_list.some(item => item.row === properties[0] && item.sader === properties[1] && item.position === properties[2])) {
                selected_obj[0].style.color = "green"
               // if prev is not tagged but have a suggestion , color it with blue.
            } else if (suggested_term_list.some(item => item.row === properties[0] && item.sader === properties[1] && item.position === properties[2])) {
                selected_obj[0].style.color = "blue"
            } else {
                // if none of the above , color it with default black.
                selected_obj[0].style.color = "black"
            }
        }
        // check if a merging between 2 terms existed before and adjust the second term color
        if (second_term !== ""){
                // check the same rules as above
              const properties = second_term.attr('id').split('_').map(x => +x);
            if (tagged_terms_list.some(item => item.row === properties[0] && item.sader === properties[1] && item.position === properties[2])) {
                second_term[0].style.color = "green"
            } else if (suggested_term_list.some(item => item.row === properties[0] && item.sader === properties[1] && item.position === properties[2])) {
                second_term[0].style.color = "blue"
            } else {
                second_term[0].style.color = "black"
            }}
         // clear some prev parameters , clear all merging parameters and containers
        second_term = "";
        full_term = "";
        merging = false;
        reset();
        // this clicked term to orange color
        $(this).css("color", "orange");
        // save both term obj and name
        selected_obj = $(this);
        selected_term = this.innerHTML;
        // load term current tags and suggestions
        term_current_tags(selected_term);
        load_suggestions(selected_term);
    }).bind('contextmenu', function (e) {// disable right click and show custom context menu
        // save right clicked term
        right_clicked = this.innerHTML;
        right_clicked_line = this.id.split("_")[0];
        // in case of not merging , save this term as potential merge option
        if (merging === false)
            second_term = $(this);
        // in case other custom menus are visible
        close_open_windows();
        // this lines to show term custom menu
        const windowHeight = $(window).height() + $(window).scrollTop();
        const top = e.pageY + 5;
        const left = e.pageX;
        const menuHeight = $(".term-menu").outerHeight();
        let y = top;
        if (windowHeight < menuHeight + top) {
            y = windowHeight - menuHeight
        }
        // Show custom menu
        $(".term-menu").toggle(100).css({
            top: y + "px",
            left: left + "px"
        });
        // disable default context menu
        return false;
    });

    // Hide context menu
    $(document).bind('contextmenu click', function () {
        $(".term-menu").hide();
    });

    // disable context-menu from custom menu
    $('.term-menu').bind('contextmenu', function () {
        return false;
    });

    // Clicked context-menu item
    $('.term-menu a').click(function () {
        $(".term-menu").hide();
    });
    // when clicking on current tags buttons , show first tab
     $('#exampleModal').on('shown.bs.modal', function (e) {
        $('a[href=\\#graph]').tab('show')
        // show graph in first tab
        load_graph()
     });
     // when clicking on show all tags button
    $('#showAllModal').on('shown.bs.modal', function (e) {
        const src = document.getElementById("listTable");
        // remove all prev records
        while (src.lastChild.id !== 'Fchild') {
            src.removeChild(src.lastChild);
        }
        src.innerHTML += "<tbody></tbody>";
        const arr = [];
        //get all cuurent tags
        document.querySelectorAll(".dropdownbox").forEach(function (d, i) {
            arr.push(d.innerText.trim())
        });
        let temp = "";
        // create new table records
        arr.sort().forEach(function (d, i) {
            let tt = "close_modal('#showAllModal');searchSuggestion(this.innerHTML);";
            temp += "<tr><th scope=\"row\">" + (i + 1) + "</th><td class='show_all_tag' onclick=" + tt + ">" + d + "</td></tr>"
        });
        // push all records
        $("#listTable > tbody").append(temp);
    });
    // when clicking on second tab of #examplemodal
    $('a[href=\\#list]').on('shown.bs.tab', function (e) {
        // clear prev table records
        table.clear().draw()
        // get all current tags and their frequencies in this poem
        load_tags_freq().done(function(d){
            data = d.tags
            Excel = []
            // make excel file ready in case of download option
            Excel.push(["#","Term","Frequency","Percent Of Total"])
            data.forEach(function(l , i){
                 // create table records and push it
                 let percent = (l.Tag.frequency/d.total*100).toFixed(2)+"%"
                 r = [i+1,l.Tag.name,l.Tag.frequency,percent]
                 table.row.add(r).draw()
                 Excel.push(r)
             });
        });
    });
    $('#myinfo').on('shown.bs.modal', function (e) {
             // create info modal for poem tag page.
             modal = document.getElementById("myinfo")
             body = modal.getElementsByClassName('modal-body')[0];
             body.innerHTML = "<ul><li>This page handle the process of tagging words.</li>"
             +"<li>Term colors logic:<ul><li><span style=\"color: green\">Green</span> color - the word has been tagged or have at least one tag.</li>"
             +"<li><span style=\"color: blue\">Blue</span> color - the system have a suggestion for what this word should be tagged as.</li>"
             +"<li><span style=\"color: orange\">Orange</span> color - you are currently tagging this word.</li>"
             +"<li><span style=\"color: black\">Black</span> color - mean nothing special.</li></ul></li>"
             +"<li>Hover over the term to show its root(stem version) , this root is used to save the term with its relations</li>"
             +"<li>Term Right Click - custom menu features<ul><li>Get definition of the term from 'almaany' dictionary.</li>"
             +"<li>Merge terms: first you need to choose a term and then choose another term to merge.</li>"
             +"<li>Merge terms only used for two terms where the first term is the last term in 'sadr' and the second term is the first term in the 'ajez' of the same row.</li>"
             +"<li>Edit line will open a window to edit the whole row , <span style=\"color: red\">WARNING</span> : changing any tagged term will strip it of all of its current tags.</li></ul></li>"
             +"<li>Selected Tags Container - show all tags of the clicked term</li>"
             +"<li>Suggested Tags Container - show all suggested tags for the clicked term</li>"
             +"<li>Hierarchy/Tree view Container - show all current tags in the server ,to travel further down in the tree press on the tag and you’ll be able to see it’s children, to go backwards you can press on the current father node."
             +"<ul><li>Right click on tags and choose add tag will tag the selected term.</li>"
             +"<li>For more information on tag right click features , go to manage tags page.</li>"
             +"<li>Add Root - allows you to add a root.</li>"
             +"<li>Show All - opens a popup which shows all the tags in alphabet order.</li>"
             +"<li>Reset - resets the tags hierarchy to its original form (showing the roots).</li></ul></li>"
             +"<li>Current Tags Button: statistics about the tagged terms in this specific poem.<ul>"
             +"<li>Graph Tab- display all tagged terms and their tags as graph.</li>"
             +"<li>List Tab- display all tagged terms and their tags in a list where the order of tags is based on the tag frequency.</li>"
             +"<li>You can download the tags in Image and Excel format for graph tab and list tab ,respectively.</li></ul></li>"
             +"<li>Click on history icon to show your previous accessed poems.</li></ul>"
     });

});


function close_open_windows() {
    // hide visible custom menus , tag and term custom menus
    if ($('#tag-menu').is(':visible')) {
        $('#tag-menu').hide();
    }
    if ($('#term-menu').is(':visible')) {
        $('#term-menu').hide();
    }
}

function loadTags() {
    //load all tags from db
    getAllTags().done(function (d) {
        all_tags = d.tags;
        update_tags_list()
    });
}

function update_tags_list() {
    // add all tags to search bar
    myUL.innerHTML = "";
    all_tags.forEach(function (idx, li) {
        myUL.innerHTML += "<li><a href=\"javascript:void(0)\" id=" + idx + " onclick=\"searchTag(this)\">" + idx + "</a></li>";
    });
}

function checkAvailability(arr, val) {
    // if val exist in the array return true otherwise false.
  return arr.some(function(arrVal) {
    return val.trim() === arrVal.target.trim();
  });
}

function filterSearch(){
    let input , filter, ul, li, a, i, txtValue;
    input = document.getElementById("mySearchInput");
    // key the client try to seach for
    filter = input.value
    const options = {
      allowTypo: false, // if you don't care about allowing typos
    }
    // get result of search
    const results = fuzzysort.go(filter, all_tags,options)
    ul = document.getElementById("myUL");
    // all tags in search bar
    li = ul.getElementsByTagName("li");
        // iterare over all tags in search bar , hide/show tag depend on fuzzy search result
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        if ( typeof a != 'undefined'){
        txtValue =a.innerText;
        if (filter.length ===0 || checkAvailability(results,txtValue)) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }}
    }
}

setTimeout(function () {
    $('.treeview').removeClass('hover');
}, 1000);



// ################################  ajax calls section ################################

function load_tags_freq() {
    return $.ajax({
        type: "GET",
        url: " get_Tags_frequency_in_poem/",
        data: {'id': poemID},
        dataType: "json",
    });
}

function get_words_analyzation(text) {
    return $.ajax({
        type: "GET",
        url: " get_words_analyzation/",
        data: {'id': poemID},
        dataType: "json",
    });
}

function getRootofWord(text) {
    return $.ajax({
        type: "GET",
        url: " get_Root_of_Word/",
        data: {'word': text},
        dataType: "json",
    });
}

function add_new_root(text) {
    return $.ajax({
        type: "GET",
        url: "add_root/",
        data: {'term': text},
        dataType: "json",
    });

}

function add_parent(text, parent) {
    return $.ajax({
        type: "GET",
        url: "add_parent/",
        data: {'term': text, 'parent': parent},
        dataType: "json",
    });
}

function changeParent(text, parent) {
    return $.ajax({
        type: "GET",
        url: "change_parent/",
        data: {'term': text, 'parent': parent},
        dataType: "json",
    });
}

function add_child(text, parent) {
    return $.ajax({
        type: "GET",
        url: "add_tag/",
        data: {'term': text, 'parent': parent},
        dataType: "json",
    });
}

function remove_tag(text) {
    return $.ajax({
        type: "GET",
        url: "remove_tag/",
        data: {'term': text},
        dataType: "json",
    });
}

function remove_tag_from_word(text, term_id) {
    let t = selected_term;
    if (merging === true)
        t = full_term;
    return $.ajax({
        type: "GET",
        url: "remove_tag_from_word/",
        data: {
            'row': term_id[0],
            'place': term_id[1],
            'position': term_id[2],
            'term': t,
            'tag': text,
            'id': poemID
        },
        dataType: "json",
    });
}

function remove_tag_children(text) {
    return $.ajax({
        type: "GET",
        url: "delete_all/",
        data: {'term': text},
        dataType: "json",
    });
}

function editTag(text, edit) {
    return $.ajax({
        type: "GET",
        url: "edit_tag/",
        data: {'term': text, 'edit': edit},
        dataType: "json",
    });
}

function getDepth(text) {
    return $.ajax({
        type: "GET",
        url: "get_depth/",
        data: {'term': text},
        dataType: "json",
    });
}

function getParent(text) {
    return $.ajax({
        type: "GET",
        url: "get_parent/",
        data: {'term': text},
        dataType: "json",
    });
}

function getHeaders() {
    $.ajax({
        type: "GET",
        url: "get_roots/",
        dataType: "json",
        success: function (data) {
            const roots = data.roots;
            roots.forEach(build_il_headers);
        }
    });
}

function getAllTags(text) {
    return $.ajax({
        type: "GET",
        url: "get_all_tags/",
        dataType: "json",
    });

}

function save_term_tag(tag) {
    const term_id = selected_obj.attr('id').split('_');
    let t = selected_term;
    if (merging === true)
        t = full_term;

    return $.ajax({
        type: "GET",
        url: "save_term_tag/",
        data: {
            'row': term_id[0],
            'place': term_id[1],
            'position': term_id[2],
            'term': t,
            'tag': tag,
            'id': poemID
        },
    });
}

function load_suggestions(term) {
    // load all suggestion for current term
    const term_id = selected_obj.attr('id').split('_');
    $.ajax({
        type: "GET",
        url: "suggest_tags/",
        data: {
            'row': term_id[0],
            'place': term_id[1],
            'position': term_id[2],
            'term': term,
            'id': poemID
        },
        dataType: "json",
        success: function (data) {
            const suggestions = data.suggestions;
            // in case there is no suggestions
            if (suggestions === undefined || suggestions.length === 0) {
                // hide suggestion container
                $("#collapseTwo").collapse("hide")
                // hide add all suggestion btn
                document.getElementById('All_suggestions').style.display = 'none';
            } else {
                // in case there is at least 1 suggestion
                suggestions.forEach(build_suggestion);
                if(suggestions.length>1)
                    // if there is more than 2 suggestion , show add all suggestions btn
                    document.getElementById('All_suggestions').style.display = 'flex';
                    // otherwise hide
                else document.getElementById('All_suggestions').style.display = 'none';
                //show suggestion container
                $("#collapseTwo").collapse("show")
            }
        }
    });
}

function term_current_tags(term) {
    // load all tags that's been tagged to this term
    const term_id = selected_obj.attr('id').split('_');
    $.ajax({
        type: "GET",
        url: "term_current_tags/",
        data: {
            'row': term_id[0],
            'place': term_id[1],
            'position': term_id[2],
            'id': poemID,
            'term': term,
        },
        dataType: "json",
        success: function (data) {
            // in case there is no tags
            if (data.tags === undefined || data.tags.length === 0) {
                // hide tagged tags container.
                $("#collapseOne").collapse("hide")

            } else {
                // otherwise , build all tags btn and show tags container
                const tags_term = data.tags.map(a => a.tag);
                tags_term.forEach(build_tag);
                $("#collapseOne").collapse("show")
            }
        }
    });
}

function add_all_suggestions_ajax(keys ,term_id){
    // when clicked in add all suggestions btn
    let t = selected_term;
    if (merging === true)
        t = full_term;
    return $.ajax({
        type: "GET",
        url: "add_all_suggestions/",
        data: {
            'row': term_id[0],
            'place': term_id[1],
            'position': term_id[2],
            'term': t,
            'tags[]':keys,
            'id': poemID,
        }
    });
}



//  ################################ end of ajax calls. ################################


//  ################################ tree view section #######################################
function change_parent() {
    // change parent of tag in the hierarchy. new parent must exist
    text = document.getElementById("change-parent").value;
    // empty insert
    if (text === "") {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "The field is empty ,Please insert a tag before clicking";
        timeout();
    } else {
        // parent equal to selected tag
        if (text === rightclicked) {
            window.alert("Error , you can`t add the term itself as parent");
            return
        }
        changeParent(rightclicked, text).done(function (d) {
            // in case the add tag not exist
            if (d.exist === false) {
                window.alert("The parent doesnt exist ,Please insert a valid one");
                return
            }
            // changing parent to decedant one will create a circle in the hierarchy which not allowed
            if (d.change === false) {
                window.alert("Error ,you can't add a descendant tag as parent");
                return
            }
            document.getElementById("change-parent").value = "";
            // refresh the tree main tag to be the right clicked tag
            search2(rightclicked);
            close_modal('#changeParentModal');
        });
    }
}

function delete_tag() {
    // delete tag from the hierarchy
    getParent(rightclicked).done(function (d) {
        // parent of the tag
        const parent = d.parent;
        // remove tag
        remove_tag(rightclicked).done(function (d2) {
            // remove tag from search bar
            document.getElementById(rightclicked).remove();
            //remove tag from all tags array
            all_tags = all_tags.filter(e => e !== rightclicked);
            if (parent.length === 0) {
                // if there is no parent , go back to all roots
                emptyTree();
                getHeaders();
                depth = 0;
                tagParent = "";
                flag = false;
            } else {
                // if there is parent , parent is current tag in the tree view.
                search2(parent[0].parent.name)
            }
        });
    });
}

function delete_all() {
    // delete tag and all of its children.
    getParent(rightclicked).done(function (d) {
        const parent = d.parent;
        remove_tag_children(rightclicked).done(function (d2) {
            // because delete all is a difficult delete , load all tags from db
            all_tags = [];
            loadTags();
            // if the removed tag have no parent
            if (parent.length === 0) {
                // go back to all roots in tree view
                emptyTree();
                getHeaders();
                depth = 0;
                tagParent = "";
                flag = false;
            } else {
                 // parent is the current tag in tree view
                search2(parent[0].parent.name)
            }
        });
    });
}

function new_parent() {
    // add new parent for tag in the hierarchy. parent mustn't exist
    text = document.getElementById("parent-name").value;
    if (text === "") {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "The field is empty ,Please insert a tag before clicking";
        timeout();
    }
    else {
        // parent is the same as selected tag
        if (text === rightclicked) {
            window.alert("Error , you can`t add the term itself as parent");
            return
        }
        add_parent(rightclicked, text).done(function (d) {
            if (d.add === false) {
                window.alert("Error , the parent already exist somewhere");
                return
            }
            // add new tag to all tags array and search bar
            all_tags.push(text);
            myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("parent-name").value = "";
            search2(rightclicked);
            close_modal('#insertParentModal');
        });
    }
}

function edit_tag() {
    // edit tag name in the hierarchy
    text = document.getElementById("edited-name").value;
    editTag(rightclicked, text).done(function (d) {
        if (d.edit === false) {
            window.alert("Error , the edit name already exist");
            return
        }
        //remove tag from searchbar
        document.getElementById(rightclicked).remove();
        // remove tag from all tags array
        all_tags = all_tags.filter(e => e !== rightclicked);
        // add new edited tag to search bar and all tags array
        all_tags.push(text);
        myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
        document.getElementById("edited-name").value = "";
        emptyTree();
        if (tagParent === "") {
            // in case edited tag is in all roots page in tree view
            getHeaders()
        } else if (tagParent === rightclicked)
            // if we're changing the current tag in hierarchy/tree view
            item_clicked(text);
        else {
            // if we're changing a child in the hierarchy/tree view
            item_clicked(tagParent)
        }
        close_modal('#editNameModal');
    });
}

function new_child() {
    // add new child for tag in the hierarchy
    text = document.getElementById("child-name").value;
    if (text === "")
        // empty insert
        window.alert("The field is empty ,Please insert a tag before clicking");
    else {
        if (text === rightclicked) {
            // child is the same as parent , no need to send to db to check if its exist or not
            window.alert("Error , you can`t add the term itself as child");
            return
        }
        //ajax call
        add_child(text, rightclicked).done(function (d) {
            if (d.Tag === false) {
                // if tag already exist
                window.alert("The tag already exist");
                return
            }
            // new tag to be pushed in all tags array and search bar
            all_tags.push(text);
            myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("child-name").value = "";
            search2(rightclicked);
            close_modal('#insertChildModal');
        });
    }
}

function new_root() {
    // add new root in the hierarchy
    const text = document.getElementById("root-name").value;
    if (text === "") {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "The field is empty ,Please insert a tag before clicking";
        timeout();
    }
    else {
        //ajax call
        add_new_root(text).done(function (d) {
            if (d.Tag === false) {
                // if tag already exist
                window.alert("The tag already exist");
                return
            }
             // new tag to be pushed in all tags array and search bar , and then go back to all roots page
            all_tags.push(text);
            myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("root-name").value = "";
            emptyTree();
            getHeaders();
            depth = 0;
            tagParent = "";
            flag = false;
            close_modal('#insertRootModal')
        });
    }
}

function close_modal(id) {
    // close current open modal by its id.
    $(id).modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
}

function emptyTree() {
    // clear all tags in the hierarchy by clearing its first , second and third layer.
    const ul = document.querySelector('.tree');
    let listLength = ul.children.length;
    for (let i = 0; i < listLength; i++) {
        ul.removeChild(ul.children[0]);
    }
    if (typeof ul1 != 'undefined') {
        listLength = ul1.children.length;
        for (let i = 0; i < listLength; i++) {
            ul1.removeChild(ul1.children[0]);
        }
    }
    if (typeof ul2 != 'undefined') {
        listLength = ul2.children.length;
        for (let i = 0; i < listLength; i++) {
            ul2.removeChild(ul2.children[0]);
        }
    }
}

/*
#for hierarchy view there is 3 layers , parent -> clicked tag -> children .
    parent are first layer , clicked tag is second layer , children are third layer
#when there is no parent , that's mean the selected tag without parent , so only 2 layers are left , tag --> children
    tag are first layer , children are second layer
# when no parent and children there is only 1 layer and that's is the selected tag
*/

function item_clicked1(obj, event) {
    //clicking on parent element of the selected tag , that's also mean were going back in the hierarchy
    event.stopPropagation();
    close_open_windows();
    // get clicked tag name
    const elem = $(obj);
    const text = elem[0].innerText.split(/\r?\n/)[0];
    if (event.target !== obj)
        return;
    // going back in hierarchy mean the depth is now less by 1
    depth = depth - 1;
    // clear tree view
    emptyTree();
    if (depth === 1)
        flag = false;
    item_clicked(text);
}

function item_clicked2(obj, event) {
    //clicking on the selected tag . can be used for refresh or to detect if the clicking term have no parent and were going back to show all roots.
    event.stopPropagation();
    close_open_windows();
     // get clicked tag name
    const elem = $(obj);
    const text = elem[0].innerText.split(/\r?\n/)[0];
    if (event.target !== obj)
        return;
     // clear tree view
    emptyTree();
    if (depth === 1)
        // if we're in depth one and we clicked on the parent of selected tag , thats mean we want to go back to all roots , so flag is true
        flag = true;
    item_clicked(text);
}

function item_clicked3(obj, event) {
    //clicking on tags children ,that's also mean were advancing in the hierarchy .in addition when roots are only shown they are treated as a child element
    event.stopPropagation();
    close_open_windows();
    // get clicked tag name
    const elem = $(obj);
    const text = elem[0].textContent.split(/\r?\n/)[0];
    // going forwad in hierarchy mean the depth is now increased by 1
    depth = depth + 1;
    // clear tree view
    emptyTree();
    if (depth === 1)
        flag = false;
    item_clicked(text);
}

function item_clicked(text) {
    // create tree for the selected tag , first create parent , second create selected tag , third create children tags
    tagParent = text;
    const ul = document.querySelector('.tree');
    getParent(text).done(function (data) {
        const parent = data.parent;
        if (parent.length === 0 && flag === true) {
            // in case we're going back to all roots
            getHeaders();
            depth = 0;
            tagParent = "";
            flag = false;
            return;
        }
        const current = document.createElement("il");
        if (parent.length > 0) {
            // if parent exist , create parent element
            const pNode = document.createElement("il");
            pNode.appendChild(document.createTextNode(parent[0].parent.name));
            pNode.setAttribute('onclick', "item_clicked1(this,event)");
            pNode.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
            pNode.setAttribute('class', "parent");
            ul.appendChild(pNode);
            ul1 = document.createElement('ul');
            pNode.appendChild(ul1);
            ul1.appendChild(current);
        }
        // create selected tag element
        current.appendChild(document.createTextNode(text));
        current.setAttribute('onclick', "item_clicked2(this,event)");
        current.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
        current.setAttribute('class', "node");
        current.setAttribute('id', "c");
        current.setAttribute("style", "color: green");
        if (parent.length === 0)
            // if there is no parent add tag to first layer
            ul.appendChild(current);
        ul2 = document.createElement('ul');
        current.appendChild(ul2);
        $.ajax({
            type: "GET",
            url: "get_children/",
            data: {'term': text},
            dataType: "json",
            success: function (data) {
                const children = data.children;
                 // create children elements
                children.forEach(build_il);
            }
        });
    });
}

function build_il(item, index) {
    // build children tag elements in the hierarchy
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(item.child.name));
    li.setAttribute('onclick', "item_clicked3(this, event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "child");
    li.setAttribute("style", "color: black");
    ul2.appendChild(li);
}

function build_il_headers(item, index) {
    // build roots tag elements in the hierarchy
    const ul = document.querySelector('.tree');
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(item.root.name));
    li.setAttribute('onclick', "item_clicked3(this,event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "child");
    ul.appendChild(li);
}

function right_click_tag(obj, e) {
    // when clicking on tag , show the custom menu.
    e.stopPropagation();
    //prevent default menu
    e.preventDefault();

    const text = obj.innerText.split(/\r?\n/)[0];
    if (e.target !== obj)
        return;
    //save the tag name that's was clicked
    rightclicked = text;
    close_open_windows();
    const windowHeight = $(window).height() + $(window).scrollTop();
    const windowWidth = $(window).width() + $(window).scrollLeft();
    const top = e.pageY + 5;
    const left = e.pageX;
    const menuHeight = $(".tag-menu").outerHeight();
    const menuwidth = $(".tag-menu").outerWidth();
    // Show contextmenu
    let x = left;
    let y = top;
    if (windowHeight < top + menuHeight) {
        y = windowHeight - menuHeight - 5
    }
    if (windowWidth < left + menuwidth) {
        x = left - menuwidth - 5
    }

    $(".tag-menu").toggle(100).css({
        top: y + "px",
        left: x + "px"
    });

    // Hide context menu
    $(document).bind('contextmenu click', function () {
        $(".tag-menu").hide();
    });

    // disable context-menu from custom menu
    $('.tag-menu').bind('contextmenu', function () {
        return false;
    });

    // Clicked context-menu item
    $('.tag-menu a').click(function () {
        $(".tag-menu").hide();
    });
}


// ################################ end of tree view section ################################


// ################################ containers section ################################

function remove_tag_in_selected(obj) {
    // remove tag from the term selected tags
    const elem = $(obj);
    // get tag name
    const btn = elem[0].getElementsByClassName("btn-txt");
    const text = btn[0].innerHTML;
    //ajax call
    let term_id = selected_obj.attr('id').split('_');
    remove_tag_from_word(text, term_id).done(function (d) {
        // d.last true mean its the last tag for the term , so we need to remove the term from all tagged term list
        if(d.exist === true && d.last === true) {
            term_id = term_id.map(x => +x);
            tagged_terms_list = tagged_terms_list.filter(function (value, index, arr) {
                if(value.position == term_id[2] && value.row == term_id[0] && value.sader == term_id[1])
                    return false;
                else return true;
            });
            // no tags left , hide the selected tags containers.
            $("#collapseOne").collapse("hide")
        }
        elem.remove();
    });
}

function add_tag_to_selected(obj, e) {
    // add tag from hierarchy to the clicked term
    event.stopPropagation();
    //prevent default menu
    e.preventDefault();
    // in case there is no merging and not a term selected
    if (merging === false && selected_term === "") {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "First you need to choose a term";
        timeout();

    } else {
        //ajax call
        save_term_tag(rightclicked).done(function (d) {
            if (d === "Success") {
                const term_id = selected_obj.attr('id').split('_').map(x => +x);
                // if the term tagged for the first time , save it in all tagged terms list
                if (!tagged_terms_list.some(item => item.row === d.row && item.sader === d.sader && item.position === d.position)) {
                    // in case that was the last tag for the clicked term , remove it from tagged term file.
                    tagged_terms_list.push({position: term_id[2], row: term_id[0], sader: term_id[1]});
                }
                // create tag element in container.
                build_tag(rightclicked);
                // show selected tags if it was hidden
                $("#collapseOne").collapse("show")
            } else {
                $("#myToast").attr("class", "toast show danger_toast").fadeIn();
                document.getElementById("toast-body").innerHTML = "Something went wrong, maybe the tag exists";
                timeout();
            }
        });
    }
}

function btn_add_all_suggestions(){
    // add all suggestion from contrainer to the selected word.
    const dict = {}
    const keys = []
    document.getElementsByClassName("suggested_container")[0].childNodes.forEach(function(d){
        // get all suggestions and push them to dictionary
        if(d.className.includes("btn")){
            const text = d.getElementsByClassName("btn-txt");
            const tag_text = text[0].innerText.slice(0, text[0].innerText.lastIndexOf("-"));
            keys.push(tag_text)
            dict[tag_text] = d
        }
    })
    let term_id = selected_obj.attr('id').split('_');
    //ajax call
    add_all_suggestions_ajax(keys,term_id).done(function(data){
       term_id = term_id.map(x=>+x)
       for (const d in data){
            // iterate over all keys and check if they all was added
            if(data[d] === true){
                // in case the term wasn't in the all tagged term list
                if (!tagged_terms_list.some(item => item.row === term_id[0] && item.sader === term_id[1] && item.position === term_id[2])) {
                     tagged_terms_list.push({position: term_id[2], row: term_id[0], sader: term_id[1]});
                }
                build_tag(d);
                //remove suggestion btn
                dict[d].remove()
            }
       }
       // show selected tag container
       $("#collapseOne").collapse("show");
       if ($('.suggested_container').children().length === 0) {
           // if there was no suggestion left , hide suggestion container
           $("#collapseTwo").collapse("hide")
           document.getElementById('All_suggestions').style.display = 'none';
       }
       if ($('.suggested_container').children().length == 1) {
           // if there was only one suggestion left , hide add all suggestion btn
           document.getElementById('All_suggestions').style.display = 'none';
       }
    });
}


function add_tag(obj) {
    // add new tag to the selected word from the the suggestion window.
    const text = obj.getElementsByClassName("btn-txt");
    const tag_text = text[0].innerText.slice(0, text[0].innerText.lastIndexOf("-"));
    save_term_tag(tag_text).done(function (d) {
        if (d === "Success") {
            // add the term to the current tagged terms
            const term_id = selected_obj.attr('id').split('_').map(x => +x);
            if (!tagged_terms_list.some(item => item.row === d.row && item.sader === d.sader && item.position === d.position)) {
                tagged_terms_list.push({position: term_id[2], row: term_id[0], sader: term_id[1]});
            }
            build_tag(tag_text);
            $("#collapseOne").collapse("show");
            obj.remove();
            if ($('.suggested_container').children().length === 0) {
                // if there was no suggestion left , hide suggestion container
                $("#collapseTwo").collapse("hide")
            }
            if ($('.suggested_container').children().length == 1) {
                // if there was only one suggestion left , hide add all suggestion btn
                document.getElementById('All_suggestions').style.display = 'none';
            }
        } else {
            window.alert("something went wrong, click again on the term")
        }
    });
}

function build_tag(tag_name) {
    // build tag element in the selected tags window for the selected term.
    const container = document.getElementsByClassName('selected_container')[0];
    container.insertAdjacentHTML('beforeend', '<button class="btn btn-sm tag-btn" onclick="remove_tag_in_selected(this)">\n' +
        '                    <i class=\'fa fa-minus\'></i>' + '&nbsp;' +
        '                    <span class="btn-txt">' + tag_name + '</span>\n' +
        '                </button>')

}

function build_suggestion(item, index) {
    // build suggestion tag element win suggestion window for the selected term.
    const container = document.getElementsByClassName('suggested_container')[0];
    container.insertAdjacentHTML('beforeend', '<button class="btn btn-sm tag-btn" onclick="add_tag(this)"> \n' +
        '                   <i class=\'fa fa-plus\'></i>' + '&nbsp;' +
        '                    <span class="btn-txt">' + item[0] + '-' + parseFloat(item[1].toFixed(4)) + '</span>\n' +
        '                </button>');

}

// ################################ end of containers section ################################

function reset() {
    // clear containers
    selected_term = "";
    const container = document.getElementsByClassName('selected_container')[0];
    const buttons = container.getElementsByTagName('button');
    for (let i = buttons.length - 1; i >= 0; --i) {
        buttons[i].remove();
    }

    const container2 = document.getElementsByClassName('suggested_container')[0];
    const buttons2 = container2.getElementsByTagName('button');
    for (let i = buttons2.length - 1; i >= 0; --i) {
        buttons2[i].remove();
    }
    //add thingy that closes the row in table
}

function timeout() {
    setTimeout(function () {
        $("#myToast").fadeOut().attr('class', 'toast danger_toast');
    }, 2500);
}


function searchSuggestion(text) {
    // search for word and present it in the hierarchy
    getDepth(text).done(function (d) {
        depth = d.depth + 1;
        emptyTree();
        if (depth === 1)
            flag = false;
        item_clicked(text);
    });
}

function refreshVis() {
    // refresh graph
    viz.reload()
}

function Convert_to_Png(e) {
      // convert graph to png for download
     const canvas = document.getElementById("viz").getElementsByTagName("canvas")[0]
     can = canvas.toDataURL()
     let link = document.createElement("a")
     link.href = can
     link.download = 'Graph'
     link.click()
}

function search2(text) {
    // search for tag in the hierarchy when text is given
    getDepth(text).done(function (d) {
        depth = d.depth + 1;
        emptyTree();
        if (depth === 1)
            flag = false;
        item_clicked(text);
    });
}

function searchTag(obj) {
    //search for rag in the hierarchy when obj is given
    getDepth(obj.innerText).done(function (d) {
        const elem = $(obj);
        const text = elem[0].innerText.split(/\r?\n/)[0];
        depth = d.depth + 1;
        emptyTree();
        if (depth === 1)
            flag = false;
        $('#tagsDropDown').toggle();
        item_clicked(text);
    });

}

function back_home() {
    // back to all roots in the hierarchy
    emptyTree();
    getHeaders();
    depth = 0;
    tagParent = "";
    flag = false;
}

function load_graph () {
        //create graph to show all tags in poem
        statement = "match p=()-[r:tag{poemID:'$'}]->() RETURN p".replace('$', poemID);
        var config = {
            container_id: "viz",
            server_url: "bolt://localhost:7687",
            server_user: "neo4j",
            server_password: "123123147",
            labels: {
                "Tag": {
                    "caption": "name",
                    "title_properties": [
                        "name"
                    ]
                },
                "Word": {
                    "caption": "name",
                    "title_properties": [
                        "name"
                    ]
                }
            },
            relationships: {
                "tag": {
                    "caption": false
                }
            },
            arrows: true,
            initial_cypher: statement
        };
        viz = new NeoVis.default(config);
        viz.render();
}



function getDefinition() {
    //The term we want the definition of is in var right_clicked
    document.getElementById('book_loader').style.display = 'block';
    let modal_body = document.getElementById('definitionModal').querySelector('.modal-body');
    setTimeout(function () {
        get_definition(right_clicked).done(function (d) {
            document.getElementById('book_loader').style.display = 'none';
            modal_body.innerHTML = d
        });
    }, 3000);
}

function get_definition(text) {
    // return $.ajax({
    //     type: "GET",
    // url: " getTaggedWords/",
    // data: {'id': poemID},
    // dataType: "json",
    // });
}

function buildLine() {
    const tbl = document.getElementById('poem');
    const row = tbl.rows[right_clicked_line - 1];
    document.getElementById('edited-sadr').value = row_to_string(row.cells[1]);
    document.getElementById('edited-ajuz').value = row_to_string(row.cells[2]);
}

function row_to_string(cell) {
    let line = "";
    const children = cell.children;
    for (let i = 0; i < children.length; i++) {
        line += children[i].innerHTML;
    }
    return line
}

function save_edited_line() {
    const sadr = document.getElementById('edited-sadr').value;
    const ajuz = document.getElementById('edited-ajuz').value;
    //TODO finish the actual saving part
    $.ajax({
        type: "GET",
        url: "edit_poem_line/",
        data: {
            'sadr': sadr,
            'ajuz': ajuz,
            'line': right_clicked_line - 1,
            'id': poemID
        },
        dataType: "json",
        success: function (data) {
            //close modal and toast success message
            // maybe reload the page with the updated line ?
        }
    });
}

function merge_term(obj, event) {
    // when merging 2 terms
    event.preventDefault();
    // need to click on term first to merge with another
    if (selected_obj === "") {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "To merge ,First you need to select a term";
        timeout();
        second_term = "";
        return
    }
    // merging when its already a merging mode
    if (merging === true) {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "you already merged two terms , reclick on the first term or any other to reset";
        timeout();
        return
    }
    const first_term_properties = selected_obj.attr('id').split('_').map(x => +x);
    const second_term_properties = second_term.attr('id').split('_').map(x => +x);
    if (first_term_properties[0] != second_term_properties[0] || second_term_properties[2] != 1 || second_term_properties[1] <= first_term_properties[1] ||
        selected_obj[0].parentNode.getElementsByTagName("span").length != first_term_properties[2]) {
        $("#myToast").attr("class", "toast show danger_toast").fadeIn();
        document.getElementById("toast-body").innerHTML = "you cant merge this two terms";
        timeout();
        return;
    }
    merging = true;
    reset();
    second_term[0].style.color = "orange";
    full_term = selected_obj[0].innerHTML.trim() + second_term[0].innerHTML.trim();
    term_current_tags(full_term);
    load_suggestions(full_term);
}

function ConvertToExcel(){
    // create a downloadable excel file.
    if(typeof Excel === 'undefined') {
        return
     }
    const array = XLSX.utils.aoa_to_sheet(Excel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, array, 'Tags Frequency')
    XLSX.writeFile(wb, 'Tags Frequency.xlsx')

}