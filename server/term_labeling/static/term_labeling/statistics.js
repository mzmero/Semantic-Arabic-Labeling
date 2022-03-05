/*
this js file to handle the statistic page.
 */

let table // first table object for list tab
let table2 // first table object for tagsin poems tab
let Excel // tags dict to be downloaded as excel file

var currentPeriod="all periods" // all periods are selected by default in word cloud tab
// connect to server and get the created word cloud based on period parameter.
var frequency = [10,20,30,50,70,80,100,200,300,400,500,1000] // default settings for frequency and range
var range= ['0-50', '50-100', '100-150', '150-200', '200-250', '250-300', '300-350', '350-400', '400-450',
            '450-500', '500-550', '550-600', '600-650', '650-700', '700-750', '750-800', '800-850', '850-900', '900-950', '950-1000']


$(document).ready(function() {
    // define first table
    table = $('#listTable').DataTable( {
        responsive: true,
        "pageLength": 100,
         columns: [
            { title: "#" },
            { title: "Term" },
            { title: "Frequency" },
            { title: "Approximate Proportion" },
            { title: "Percent of Total" },
        ]
    } );
     // define second table
    table2 = $('#tagTable').DataTable( {
        responsive: true,
        "pageLength": 10,
         columns: [
            { title: "#" },
            { title: "Term" },
            { title: "Frequency" },
            { title: "Percent of Total" },
        ]
    } );
        // apply tooltip
      $('[data-toggle="tooltip"]').tooltip({
        trigger : 'hover'
       });

     $('#myinfo').on('shown.bs.modal', function (e) {
             // create info modal for statistics page.
             modal = document.getElementById("myinfo")
             body = modal.getElementsByClassName('modal-body')[0];
             body.innerHTML = "<ul><li>This page have some general info about our current poems and poets in the database, it can be changed after a successful sync to fuzi database.</li>"
             +"<li>WordCloud Tab: Display Top Frequents Words"
             +"<ul><li>'All periods' are the default parameter , you can choose another time period to display their current top words.</li>"
             +"<li>TOP N : choose how many words to display , for a max of 1000 words.</li>"
             +"<li>Range: choose a range of words to display , example: 50-100 will show the top 50th most frequent word till the 100th most frequent word.</li>"
             +"<li>When a period was chosen the top N and range scale will be adjusted to match that period max number of words.</li></ul></li>"
             +"<li>List View Tab : Display Top Frequent Words"
             +"<ul><li>Choosing a period or all periods will result a max of 2000 words , Any more words will have a negative effect on the browser performance.</li>"
             +"<li>There is a search bar to search for the requested word.</li>"
             +"<li>By clicking on one of the table titles , the table will be sorted by that title content in alphabet.</li></ul></li>"
             +"<li>Poems Tab: Display Top Frequents Tags<ul>"
             +"<li>Choose a poet and the tags in all that poet poem's will be fetched from the DB , each tag will be counted and displayed in a table in freqeuncy order.</li>"
             +"<li>There is a search bar to search for the requested Tag.</li>"
             +"<li>By clicking on one of the table titles , the table will be sorted by that title content in alphabet.</li></ul></li>"
             +"<li>Click on history icon to show your previous accessed poems.</li></ul>"
     });
} );

function Create_frequency_array(number){
    // return array of frequency based on the given number.
    var array = frequency.slice()
    var i = 0;
    while (i < array.length && array[i]<number) {
        i++;
    }
    if (i < array.length){
        array = array.slice(0,i)
        if(array[i] != number){
            array.push(number)
         }
    }
    return array.reverse()
}


function Create_range_array(number){
    // return array of ranges based on the given number.
     var array = range.slice()
     var i = 0;
     var temp = ""
     while (i < array.length) {
        temp = array[i].split('-')
        first = parseInt(temp[0])
        second = parseInt (temp[1])
        if (number> first && number<second){
            break;
        }
        i++;
     }
      if (i < array.length){
        array = array.slice(0,i)
        temp[1] = number.toString()
        array.push(temp[0]+'-'+temp[1])
      }
      return array

}
// ################################ ajax section ################################
function get_terms_freq(f , n , p) {
    return $.ajax({
        type: "GET",
        url: "get_terms_freq/",
        data: {'f': f,'n':n,'p':p},
        dataType: "json",
    });
}

function get_max_freq(p) {
    return $.ajax({
        type: "GET",
        url: "maxFrequencyinPeriod/",
        data: {'p':p},
        dataType: "json",
    });
}

function get_all_tags_for_poet(id) {
    return $.ajax({
        type: "GET",
        url: "get_all_tags_for_poet/",
        data: {'id':id},
        dataType: "json",
    });
}
// ################################ end of ajax section ################################



function create_dropdown(freqencyId , rangeId , clickfunction , array1 , array2){
        // from given paramets create dropdown content
       var src = document.getElementById(freqencyId);
       if (src.hasChildNodes()) {
          src.innerHTML = '';
       }
       array1.forEach(function(l){
              src.innerHTML += "<a href=\"javascript:void(0)\" onclick="+clickfunction+"(this,event,1)>"+l+"</a>"
        });
       src = document.getElementById(rangeId);
       if (src.hasChildNodes()) {
          src.innerHTML = '';
       }
       array2.forEach(function(l){
              src.innerHTML += "<a href=\"javascript:void(0)\" onclick="+clickfunction+"(this,event,2)>"+l+"</a>"
       });
}

function createWordCloud(obj, event,num){
    // this function responsible for creating image of word cloud based on top k after receiving it from server.
    var el = obj.parentNode;
    el.style.display = "none";
    setTimeout(function() {
            el.style.removeProperty("display");
     }, 30);
    var src = document.getElementById("cloud");
    while (src.lastChild.id !== 'loader') {
        src.removeChild(src.lastChild);
    }
      document.getElementById("loader").style.display = "block";
      get_terms_freq(obj.innerText,num,currentPeriod).done(function(d){
      var delayInMilliseconds = 500;
      setTimeout(function() {
        d.t.forEach(function(part, index) {
          var num = part.freq*100
          part.freq = num.toFixed(2);
        });
        var chart = anychart.tagCloud(d.t);
        if (num == 1)
            chart.title('$ most frequent words'.replace('$',d.m));
        else {
            temp = obj.innerText.split("-")[0];
            temp = temp +'-'+d.m;
            chart.title('$ most frequent words'.replace('$',temp))
        }
      // set an array of angles at which the words will be laid out
        chart.angles([0]);
          // enable a color range
        chart.colorRange(true);
          // set the color range length
        chart.colorRange().length('80%');// display the word cloud chart
        chart.container("cloud");
        chart.tooltip().format("Frequency:{%value}\nPercent of Total:{%freq}%");
        chart.draw();
        document.getElementById("loader").style.display = "none";
        }, delayInMilliseconds);
      });

}

function createList(obj,event){
    // this function responsible for creating list of words based on period or all periods , top are 2000 words to reduce lags.
    var el = obj.parentNode;
    el.style.display = "none"
    setTimeout(function() {
            el.style.removeProperty("display");
     }, 30);
    table.clear().draw()
    document.getElementById("tablePageHeader").innerText = 'فترة $ '.replace('$',obj.innerText)
    document.getElementById("loader2").style.display = "block";
    get_terms_freq(" ",3,obj.id).done(function(d){
        data = d.t
        data.forEach(function(l , i){
             var percent = (l.freq*100).toFixed(2)+"%"
             table.row.add( [i+1,l.x,l.value,parseFloat(l.freq.toFixed(5)),percent]).draw()
         });
        document.getElementById("loader2").style.display = "none";
    });
}


function savePeriod(obj){
    // save clicked period and the adjust filter options
    var el = obj.parentNode;
    el.style.display = "none"
    setTimeout(function() {
            el.style.removeProperty("display");
     }, 30);
    var src = document.getElementById("periodbtn");
    src.value = obj.innerText
    currentPeriod = obj.innerText.toLowerCase();
    if(currentPeriod == "all periods"){
        create_dropdown("Frequency1","Range1","createWordCloud",frequency.reverse(),range)

    }else {
    get_max_freq(currentPeriod).done(function(d){
       array1 = Create_frequency_array(d.max)
       array2 = Create_range_array(d.max)
       create_dropdown("Frequency1","Range1","createWordCloud",array1,array2)
     });
     }

}

function get_tags_for_poet(obj){
    // when poet is selected , get all tags for the poet poems.
    var el = obj.parentNode;
    el.style.display = "none"
    setTimeout(function() {
            el.style.removeProperty("display");
    }, 30);
    var src = document.getElementById("poetbtn");
    src.value = obj.innerText
    poet_id = obj.id
    table2.clear().draw()
    document.getElementById("ExcelDownload").style.display = "none";
    get_all_tags_for_poet(poet_id).done(function(d){
        data = d.tags
        Excel = []
        Excel.push(["#","Term","Frequency","Percent Of Total"])
        if (data.length > 0){
            document.getElementById("ExcelDownload").style.display = "block";
        }
        data.forEach(function(l , i){
             var percent = (l.Tag.frequency/d.total).toFixed(2)+"%"
             const r = [i+1,l.Tag.name,l.Tag.frequency,percent]
             table2.row.add(r).draw()
             Excel.push(r)
         });
    });
}

function filterFunction(dropDownId, inputId) {
    // when searching in poet searchbar , filter the result
    let input, filter, ul, li, a, i;
    input = document.getElementById(inputId);
    filter = input.value.toUpperCase();
    let divv = document.getElementById(dropDownId);
    a = divv.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
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