/*
this method initializes the manage tag page.
 */

// ################################ global parameters ################################
let tagParent = ""; // current selected tag in the hierarchy
let depth = 0;  // current depth of the selected tag in the hierarchy.
let ul1;  // second layer of tree view
let ul2; // third layer of tree view
let flag; // //flag false mean we're not returning to all roots , true mean w'ere returning to all roots if the tag have no parent
let viz; // object that's present the graph of tags
let all_tags = [];  // all tags in the db.
let flagviz = false; // true for showing all subtree tags , false for showing only parent and children of tag
let state = 1       // state 1 prefer to all roots case , 2 for traversal the hierarchy
let flagdisable = false  // false if the graph is disabled , true if enable
let rightclicked = ""; // tag in the hierarchy that's we right clicked on

// ################################ end of global parameters ################################

// ################################ helpful functions and others ################################
$(document).ready(function () {
/*
only when document ready , do all required functions.
*/
    //get all roots
     getHeaders()
     //apply tooltip for all elements
     $('[data-toggle="tooltip"]').tooltip({
        trigger : 'hover'
       });
       // on click hide the visible search bar options
     $(document).click(function (e) {
         if($('#tagsDropDown').is(':visible') && e.target.id != "mySearchInput" && e.target.className != "dropdownbox")
            {
                 $('#tagsDropDown').hide();
            }
     });
       // save all tags for fuzzy search purpose
      document.querySelectorAll(".dropdownbox").forEach(function (d, i) {
            all_tags.push(d.innerText.trim())
       });
     $('#myinfo').on('shown.bs.modal', function (e) {
             // create info modal for statistics page.
             modal = document.getElementById("myinfo")
             body = modal.getElementsByClassName('modal-body')[0];
             body.innerHTML = "<ul><li>Tree View - Here you can see the full tags hierarchy, at first glance you only see the roots, to travel further down press on the root and you’ll be able to see it’s children, to go backwards you can press on the current father node (the top right one).</li>"
             +"<li>Tag Right Click- custom menu<ul><li>Add parent - opens a popup which allows you to add a parent to the current tag.</li>"
             +"<li>Add child - opens a popup which allows you to add a child to the current tag.</li>"
             +"<li>Edit - opens a popup which allows you to edit the tag name.</li>"
             +"<li>Change parent - opens a popup which allows you to type the name of the new parent of this tag and it changes it’s location.</li>"
             +"<li>Delete tag - deletes the tag, if the tag has children it levels them up</li>"
             +"<li>Delete all - deletes the tag and all its children</li></ul></li>"
             +"<li>Tree View Buttons<ul><li>Add Root - allows you to add a root.</li>"
             +"<li>Reset - resets the tags hierarchy to its original form (showing the roots).</li></ul></li>"
             +"<li>Graph Buttons<ul><li>Refresh - refreshed the loaded graph.</li>"
             +"<li>Disable Network - disables the network, you can use it when it’s taking too long to load. </li>"
             +"<li>Show Subtree - shows/hide the subtrees of the current node.</li></ul></li>"
             +"<li>Click on history icon to show your previous accessed poems.</li></ul>"
     });
});


function loadTags() {
    //load all tags from db
    getAllTags().done(function (d) {
        all_tags = d.tags;
        update_tags_list()
    });
}

function showTags() {
    //toggle search bar tags
    $('#tagsDropDown').toggle();
}

function update_tags_list() {
     // add all tags to search bar
    let myUL = document.getElementById('myUL');
    myUL.innerHTML = "";
    all_tags.forEach(function (idx, li) {
        myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + idx + " onclick=\"searchTag(this)\">" + idx + "</a></li>";
    });
}

function searchTag(obj) {
    // search for tag in the hierarchy when obj is given
    getDepth(obj.innerText).done(function (d) {
        const elem = $(obj);
        const text = elem[0].innerText.split(/\r?\n/)[0];
        depth = d.depth + 1;
        emptyTree();
        if (depth === 1)
            flag = false;
        item_clicked(text);
         $('#tagsDropDown').toggle();
    });
}

function close_modal(id) {
    // close current open modal by its id.
    $(id).modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
}

function close_open_window(){
    // hide visible custom menus
    if($('#context-menu').is(':visible')){
        $('#context-menu').hide();
    }
}

function back_home(){
     // back to all roots in the hierarchy
     emptyTree()
     getHeaders();
     depth = 0;
     tagParent = "";
     flag = false;
     if(flagdisable == false){
     viz.clearNetwork();
     viz.reinit(config);
     viz.renderWithCypher("MATCH (n:Tag)-[p:Parent]-(t:Tag) where n.parent=-1 RETURN *");
     document.getElementById("showsub").disabled = true;
     }
     document.getElementById("backhome").disabled = true;
     document.getElementById("addRoot").disabled = false;
     state = 1;
     return;

}


// ################################ end of helpful functions and others ################################

// ################################ graph section ################################

function draw() {
    //draw the default graph
    viz = new NeoVis.default(config);
    viz.render()
}

function draw2(text) {
    // draw the graph based on selected tag
    statement = 'match (n:Tag{name:"$"}) optional match (n)-[p2:Parent]->(m:Tag) optional match (t:Tag) -[p1:Parent]-> (n)  RETURN *'
    statement = statement.replace('$', text);
    viz.renderWithCypher(statement)
}

function draw3() {
    // change graph when show/hide subtree btn is selected
    temp = document.querySelector('#showsub').textContent;
    if (temp == "Show subTree") {
        flagviz = true;
        document.querySelector('#showsub').textContent = "Hide subTree"
    } else {
        flagviz = false;
        document.querySelector('#showsub').textContent = "Show subTree"
    }
    if (tagParent === "") {
        //viz.render()
        return
    } else createNetwork()
}

function renderviz() {
    viz.reload()
}

function disable(){
    // disable/enable graph in the page
    temp = document.querySelector('#disable').textContent;
    if(temp == "Disable Network"){
        // disable the graph
         flagdisable = true
         document.getElementById("showsub").disabled = true;
         document.getElementById("render").disabled = true;
         document.querySelector('#disable').textContent = "Enable Network"
         viz.clearNetwork()
         document.getElementsByClassName('infinity')[0].style.display = "block";
         }
    else {
         //enable the graph
         flagdisable = false
         document.querySelector('#disable').textContent = "Disable Network"
         document.getElementById("render").disabled = false;
         document.getElementsByClassName('infinity')[0].style.display = "none";
         if(state == 1){
            viz.reinit(config);
            viz.renderWithCypher("MATCH (n:Tag)-[p:Parent]-(t:Tag) where n.parent=-1 RETURN *");
         }else if(state == 2){
            document.getElementById("showsub").disabled = false;
            createNetwork()
         }
    }
}
function createNetwork(){
    // create graph when a tag is selected
     if(flagviz==false){
         viz.reinit(config2)
         draw2(tagParent)
      }
      else {
           viz.reinit(config3)
           statement='match p=(n:Tag{name:"$"})-[par:Parent*]->(t:Tag) return p as c UNION match (n:Tag) where n.name="$" return n as c'.replaceAll('$',tagParent)
           viz.renderWithCypher(statement)
       }
}

function createNetworkforRoots(){
      // create graph for all roots only
      emptyTree();
      getHeaders();
      depth = 0;
      tagParent = "";
      flag = false;
      if(flagdisable == false){
          viz.clearNetwork();
          viz.reinit(config);
          viz.renderWithCypher("MATCH (n:Tag)-[p:Parent]-(t:Tag) where n.parent=-1 RETURN *");
       }
       state = 1;
}

var config = {
    // first graph configuration when page loaded
    container_id: "viz",
    server_url: "bolt://localhost:7687",
    server_user: "neo4j",
    server_password: "123123147",
    labels: {
        "Tag": {
            "caption": "name",
            //"size" : "match (n:Tag) where id(n) = {id} match (n)-[p:Parent]->(t:Tag) return count(p)",
            //"sizeCypher" : "match (n:Tag) where id(n) = $id match (n)-[p:Parent]->(t:Tag) return count(p)",
            //"community": "match p= (n:Tag)-[Pr:Parent*]->(t:Tag) return size(Pr) order by size(Pr) DESC limit 1",
            "community": "parent",
            "title_properties": [
                "name",

            ]
        }
    },
    relationships: {
        "Parent": {
            //"thickness": "weight",
            "caption": false
        }
    },
    arrows: true,
    hierarchical: false,
    initial_cypher: "MATCH (n:Tag)-[p:Parent]-(t:Tag) where n.parent=-1 RETURN *"
};


var config2 = {
    // second configuration for graph ,hierarchical graph true
    container_id: "viz",
    server_url: "bolt://localhost:7687",
    server_user: "neo4j",
    server_password: "123123147",
    labels: {
        "Tag": {
            "caption": "name",
            "community": "parent",
            "title_properties": [
                "name",
            ]
        }
    },
    relationships: {
        "Parent": {
            "thickness": "weight",
            "caption": false
        }
    },
    arrows: true,
    hierarchical: true,
    //initial_cypher: "optional MATCH (n:Tag) where n.parent=-1 RETURN *"
};

var config3 = {
    // third configuration , hierarchical graph false
    container_id: "viz",
    server_url: "bolt://localhost:7687",
    server_user: "neo4j",
    server_password: "123123147",
    labels: {
        "Tag": {
            "caption": "name",
            //"size" : "match (n:Tag) where id(n) = {id} match (n)-[p:Parent]->(t:Tag) return count(p)",
            //"sizeCypher" : "match (n:Tag) where id(n) = $id match (n)-[p:Parent]->(t:Tag) return count(p)",
            //"community": "match p= (n:Tag)-[Pr:Parent*]->(t:Tag) return size(Pr) order by size(Pr) DESC limit 1",
            "community": "parent",
            "title_properties": [
                "name",

            ]
        }
    },
    relationships: {
        "Parent": {
            //"thickness": "weight",
            "caption": false
        }
    },
    arrows: true,
    hierarchical: false,
    //initial_cypher: "MATCH (n:Tag) where n.parent=-1 RETURN *"
};


// ################################ end of graph section ################################


// ################################ ajax section ################################


function getAllTags(text) {
    return $.ajax({
        type: "GET",
        url: "get_all_tags/",
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

function getHeaders() {
    $.ajax({
        type: "GET",
        url: "get_roots/",
        dataType: "json",
        success: function (data) {
            roots = data.roots;
            roots.forEach(build_il_headers);
            return;
        }
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

function getBrothers(text, parent) {
    return $.ajax({
        type: "GET",
        url: "get_brothers/",
        data: {'term': text, 'parent': parent},
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

function remove_tag(text) {
    return $.ajax({
        type: "GET",
        url: "remove_tag/",
        data: {'term': text},
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


// ################################ end of ajax section ################################

// ################################ hierarchy section ################################

function change_parent() {
    // change parent of tag in the hierarchy.
    text = document.getElementById("change-parent").value
    if (text === "")
        window.alert("The field is empty ,Please insert a tag before clicking");
    else {
        if (text === rightclicked) {
            window.alert("Error , you can`t add the term itself as parent");
            return
        }
        changeParent(rightclicked, text).done(function (d) {
            if (d.exist === false) {
                window.alert("The parent doesnt exist ,Please insert a valid one");
                return
            }
            if (d.change === false) {
                window.alert("Error ,you can't add a descendant tag as parent");
                return
            }
            document.getElementById("change-parent").value = ""
            search2(rightclicked)
            close_modal('#changeParentModal')
        });

    }
}

function delete_tag() {
    // delete tag from the hierarchy
    getParent(rightclicked).done(function (d) {
        var parent = d.parent;
        remove_tag(rightclicked).done(function (d2) {
            document.getElementById(rightclicked).remove();
            all_tags = all_tags.filter(e => e !== rightclicked);
            if (parent.length === 0) {
                createNetworkforRoots();
                document.getElementById("showsub").disabled = true;
                document.getElementById("addRoot").disabled = false;
            } else {
                search2(parent[0].parent.name)
            }
        });
    });
}

function delete_all() {
    // delete tag and all of its children.
    getParent(rightclicked).done(function (d) {
        var parent = d.parent;
        remove_tag_children(rightclicked).done(function (d2) {
            all_tags = [];
            loadTags();
            if (parent.length === 0) {
               createNetworkforRoots();
                document.getElementById("showsub").disabled = true;
                document.getElementById("addRoot").disabled = false;
            } else {
                search2(parent[0].parent.name)
            }
        });

    });
}

function new_parent() {
    // add new parent for tag in the hierarchy
    text = document.getElementById("parent-name").value
    if (text === "")
        window.alert("The field is empty ,Please insert a tag before clicking");
    else {
        if (text === rightclicked) {
            window.alert("Error , you can`t add the term itself as parent");
            return
        }
        add_parent(rightclicked, text).done(function (d) {
            if (d.add == false) {
                window.alert("Error , the parent already exist somewhere");
                return
            }
            all_tags.push(text);
            myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("parent-name").value = "";
            search2(rightclicked);
            close_modal('#insertParentModal')
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
        document.getElementById(rightclicked).remove();
        all_tags = all_tags.filter(e => e !== rightclicked);
        all_tags.push(text);
        myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
        document.getElementById("edited-name").value = "";
        emptyTree();
        if (tagParent === "") {
            getHeaders()
        } else if (tagParent === rightclicked)
            item_clicked(text);
        else {
            item_clicked(tagParent)
        }
        close_modal('#editNameModal')
    });


}

function new_child() {
    // add new child for tag in the hierarchy
    text = document.getElementById("child-name").value
    if (text === "")
        window.alert("The field is empty ,Please insert a tag before clicking");
    else {
        if (text === rightclicked) {
            window.alert("Error , you can`t add the term itself as child");
            return
        }
        add_child(text, rightclicked).done(function (d) {
            if (d.Tag === false) {
                window.alert("The tag already exist");
                return
            }
            all_tags.push(text);
            myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("child-name").value = "";
            search2(rightclicked);
            close_modal('#insertChildModal')
        });
    }
}

function new_root(){
    // add new root in the hierarchy
    text = document.getElementById("root-name").value
    if (text === "")
        window.alert("The field is empty ,Please insert a tag before clicking");
    else {
        add_new_root(text).done(function (d) {
            if (d.Tag === false) {
                window.alert("The tag already exist");
                return
            }
            all_tags.push(text);
            myUL.innerHTML += "<li><a href=\"javascript:void(0)\" class=\"dropdownbox\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("root-name").value = "";
            createNetworkforRoots()
            close_modal('#insertRootModal')
        });
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
    close_open_window()
    event.stopPropagation();
    const elem = $(obj);
    const text = elem[0].innerText.split(/\r?\n/)[0];
    if (event.target != obj)
        return;
    depth = depth - 1;
    emptyTree();
    if (depth === 1)
        flag = false;
    item_clicked(text);
}

function item_clicked2(obj, event) {
    //clicking on the selected tag . can be used for refresh or to dected if the clicking term have no parent and were going back to show all roots.
    close_open_window()
    event.stopPropagation();
    const elem = $(obj);
    const text = elem[0].innerText.split(/\r?\n/)[0];
    if (event.target != obj)
        return;
    emptyTree();
    if (depth === 1)
        flag = true;
    item_clicked(text);
}

function item_clicked3(obj, event) {
    //clicking on tags children ,that's also mean were advancing in the hierarchy .in addition when roots are only shown they are treated as a child element
    close_open_window()
    event.stopPropagation();
    const elem = $(obj);
    const text = elem[0].innerText;
    if (event.target != obj)
        return;
    depth = depth + 1;
    emptyTree();
    if (depth === 1)
        flag = false;
    item_clicked(text);
}


function item_clicked(text) {
    // create tree for the selected tag , first create parent , second create selected tag , third create children tags
    tagParent = text;
    var ul = document.querySelector('.tree');
    getParent(text).done(function (data) {
        var parent = data.parent;
        if (parent.length === 0 && flag === true) {
            // in case we're going back to all roots
            getHeaders();
            depth = 0;
            tagParent = "";
            flag = false;
            if(flagdisable == false){
                viz.clearNetwork();
                viz.reinit(config);
                viz.renderWithCypher("MATCH (n:Tag)-[p:Parent]-(t:Tag) where n.parent=-1 RETURN *");
                document.getElementById("showsub").disabled = true;
            }
            document.getElementById("addRoot").disabled = false;
            document.getElementById("backhome").disabled = true;
            state = 1;
            return;
        }
        if(flagdisable == false){
             // if graph enabled
             createNetwork();
             document.getElementById("showsub").disabled = false;
         }
        document.getElementById("addRoot").disabled = true;
        document.getElementById("backhome").disabled = false;
        state = 2
        var current = document.createElement("il");
        if (parent.length > 0) {
            // if parent exist , create parent element
            var pNode = document.createElement("il");
            pNode.appendChild(document.createTextNode(parent[0].parent.name));
            pNode.setAttribute('onclick', "item_clicked1(this,event)");
            pNode.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
            pNode.setAttribute('class', "parent");
            ul.appendChild(pNode);
            ul1 = document.createElement('ul');
            pNode.appendChild(ul1);
            ul1.appendChild(current)
        }
        current.appendChild(document.createTextNode(text));
        current.setAttribute('onclick', "item_clicked2(this,event)");
        current.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
        current.setAttribute('class', "node");
        current.setAttribute('id', "c");
        current.setAttribute("style", "color: green");
        if (parent.length == 0)
            ul.appendChild(current);
        else {
            getBrothers(text, parent[0].parent.name).done(function (data) {
                d = data.brothers;
                d.forEach(build_il_brothers)
            });
        }
        ul2 = document.createElement('ul');
        current.appendChild(ul2);

        $.ajax({
            type: "GET",
            url: "get_children/",
            data: {'term': text},
            dataType: "json",
            success: function (data) {
                const children = data.children;
                children.forEach(build_il);
                return;
            }
        });
    });
}


function build_il(item, index) {
    // build children tag elements in the hierarchy
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(item.child.name));
    li.setAttribute('onclick', "item_clicked3(this,event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "child");
    li.setAttribute("style", "color: black");
    ul2.appendChild(li);
}

function build_il_brothers(item, index) {
    // build brother tag elements in the hierarchy
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(item.brother.name));
    li.setAttribute('onclick', "item_clicked2(this,event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "node");
    li.setAttribute("style", "color: black");
    ul1.appendChild(li);
}


function build_il_headers(item, index) {
    // build roots tag elements in the hierarchy
    var ul = document.querySelector('.tree');
    var li = document.createElement("li");
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
    if (e.target != obj)
        return;
    //save the tag name that's was clicked
    rightclicked = text;
    close_open_window()
    const top = e.pageY + 5;
    const left = e.pageX;
    // Show contextmenu
    $(".context-menu").toggle(100).css({
        top: top + "px",
        left: left + "px"
    });

    // Hide context menu
    $(document).bind('contextmenu click', function () {
        $(".context-menu").hide();
    });

    // disable context-menu from custom menu
    $('.context-menu').bind('contextmenu', function () {
        return false;
    });

    // Clicked context-menu item
    $('.context-menu a').click(function () {
        $(".context-menu").hide();
    });
}
// ################################ end of hierarchy section ################################

function emptyTree() {
    var ul = document.querySelector('.tree');
    var listLength = ul.children.length;
    for (i = 0; i < listLength; i++) {
        ul.removeChild(ul.children[0]);
    }
    if (typeof ul1 != 'undefined') {
        listLength = ul1.children.length;
        for (i = 0; i < listLength; i++) {
            ul1.removeChild(ul1.children[0]);
        }
    }
    if (typeof ul2 != 'undefined') {
        listLength = ul2.children.length;
        for (i = 0; i < listLength; i++) {
            ul2.removeChild(ul2.children[0]);
        }
    }
}


function checkAvailability(arr, val) {
  return arr.some(function(arrVal) {
    return val.trim() === arrVal.target.trim();
  });
}

function filterSearch(){
    let input , filter, ul, li, a, i, txtValue;
    input = document.getElementById("mySearchInput");
    filter = input.value
    const options = {
      allowTypo: false, // if you don't care about allowing typos
    }
    const results = fuzzysort.go(filter, all_tags,options)
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName("li");
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


