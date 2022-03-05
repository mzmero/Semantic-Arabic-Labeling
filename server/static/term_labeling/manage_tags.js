/*
this method initializes the manage tag page.
 */


let tagParent = "";
let depth = 0;
let ul1;
let ul2;
let flag;
let viz;
let all_tags = [];
let flagviz = false;
let state = 1
let flagdisable = false

function loadTags() {
    getAllTags().done(function (d) {
        all_tags = d.tags;
        update_tags_list()
    });
}

function showTags() {
    $('#tagsDropDown').toggle();
}

function update_tags_list() {
    let myUL = document.getElementById('myUL');
    myUL.innerHTML = "";
    all_tags.forEach(function (idx, li) {
        myUL.innerHTML += "<li><a href=\"#\" id=" + idx + " onclick=\"searchTag(this)\">" + idx + "</a></li>";
    });
}


function draw() {
    viz = new NeoVis.default(config);
    viz.render();
}

function draw2(text) {
    statement = 'match (n:Tag{name:"$"}) optional match (n)-[p2:Parent]->(m:Tag) optional match (t:Tag) -[p1:Parent]-> (n)  RETURN *'
    statement = statement.replace('$', text);
    viz.renderWithCypher(statement)
}

function draw3() {
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
    temp = document.querySelector('#disable').textContent;
    if(temp == "Disable Network"){
         flagdisable = true
         document.getElementById("showsub").disabled = true;
         document.getElementById("render").disabled = true;
         document.querySelector('#disable').textContent = "Enable Network"
         viz.clearNetwork()}
    else {
         flagdisable = false
         document.querySelector('#disable').textContent = "Disable Network"
         document.getElementById("showsub").disabled = false;
         document.getElementById("render").disabled = false;
         if(state == 1){
            viz.reinit(config);
            viz.renderWithCypher("MATCH (n:Tag)-[p:Parent]-(t:Tag) where n.parent=-1 RETURN *");
         }else if(state == 2){
            createNetwork()
         }
    }
}
function createNetwork(){
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

function searchTag(obj) {
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


function change_parent() {
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
            $('#changeParentModal').modal('hide')
        });

    }
}

function delete_tag() {
    getParent(rightclicked).done(function (d) {
        var parent = d.parent;
        remove_tag(rightclicked).done(function (d2) {
            document.getElementById(rightclicked).remove();
            all_tags = all_tags.filter(e => e !== rightclicked);
            if (parent.length === 0) {
                createNetworkforRoots();
            } else {
                search2(parent[0].parent.name)
            }
        });
    });
}

function delete_all() {
    getParent(rightclicked).done(function (d) {
        var parent = d.parent;
        remove_tag_children(rightclicked).done(function (d2) {
            all_tags = [];
            loadTags();
            if (parent.length === 0) {
               createNetworkforRoots();
            } else {
                search2(parent[0].parent.name)
            }
        });

    });
}

function new_parent() {

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
            myUL.innerHTML += "<li><a href=\"#\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("parent-name").value = "";
            search2(rightclicked);
            $('#insertParentModal').modal('hide')
        });
    }

}

function edit_tag() {
    text = document.getElementById("edited-name").value;
    editTag(rightclicked, text).done(function (d) {
        if (d.edit === false) {
            window.alert("Error , the edit name already exist");
            return
        }
        document.getElementById(rightclicked).remove();
        all_tags = all_tags.filter(e => e !== rightclicked);
        all_tags.push(text);
        myUL.innerHTML += "<li><a href=\"#\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
        document.getElementById("edited-name").value = "";
        emptyTree();
        if (tagParent === "") {
            getHeaders()
        } else if (tagParent === rightclicked)
            item_clicked(text);
        else {
            item_clicked(tagParent)
        }
        $('#editNameModal').modal('hide')
    });


}

function new_child() {
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
            myUL.innerHTML += "<li><a href=\"#\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("child-name").value = "";
            search2(rightclicked);
            $('#insertChildModal').modal('hide')
        });
    }
}

function new_root(){
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
            myUL.innerHTML += "<li><a href=\"#\" id=" + text + " onclick=\"searchTag(this)\">" + text + "</a></li>";
            document.getElementById("root-name").value = "";
            createNetworkforRoots()
            $('#insertRootModal').modal('hide')
        });
    }

}

function item_clicked1(obj, event) {
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
    tagParent = text;
    var ul = document.querySelector('.tree');
    getParent(text).done(function (data) {
        var parent = data.parent;
        if (parent.length === 0 && flag === true) {
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
            return;
        }
        if(flagdisable == false)
              createNetwork();
        state = 2
        var current = document.createElement("il");
        if (parent.length > 0) {
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
    //var ul = document.querySelector('.tree');
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(item.child.name));
    li.setAttribute('onclick', "item_clicked3(this,event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "child");
    li.setAttribute("style", "color: black");
    ul2.appendChild(li);
}

function build_il_brothers(item, index) {
    //var ul = document.querySelector('.tree');
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(item.brother.name));
    li.setAttribute('onclick', "item_clicked2(this,event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "node");
    li.setAttribute("style", "color: black");
    ul1.appendChild(li);
}


function build_il_headers(item, index) {
    var ul = document.querySelector('.tree');
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(item.root.name));
    li.setAttribute('onclick', "item_clicked3(this,event)");
    li.setAttribute('oncontextmenu', 'right_click_tag(this, event)');
    li.setAttribute('class', "child");
    ul.appendChild(li);
}

let rightclicked = "";

function right_click_tag(obj, e) {
    e.stopPropagation();
    //prevent default menu
    e.preventDefault();

    const text = obj.innerText.split(/\r?\n/)[0];
    if (e.target != obj)
        return;
    rightclicked = text;
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

function filterSearch() {
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById("mySearchInput");
    filter = input.value.toUpperCase();
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

function search2(text) {
    getDepth(text).done(function (d) {
        depth = d.depth + 1;
        emptyTree();
        if (depth === 1)
            flag = false;
        item_clicked(text);
    });
}

//window.onload = loadTags();
window.onload = getHeaders();


var config = {
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
