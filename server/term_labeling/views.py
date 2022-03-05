from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from .scripts.tagGraph import Tag
from .scripts.mongodbConnector import Connector
from .scripts.wordTagging import Tagging
from django.contrib.auth.decorators import login_required, user_passes_test
import pyarabic.araby as araby
from threading import Lock
from farasa.stemmer import FarasaStemmer
import json
from django.contrib.staticfiles import finders
from collections import Counter
import re
from datetime import datetime

"""
    all clients request will be sent her , in order to establish a connection between frontend and backend.
"""

# tool for stemming the arabic word to its roots.
stemmer = FarasaStemmer(interactive=True)


@login_required()  # only users view this page
def main_tag_page(request):
    """
    # the poem tagging page.
    :param request: have the unique id of poem
    :return:
    """
    t = Tag()
    all_tags = t.getAllTags()["tags"]
    c = Connector()
    if request.method == 'GET':
        poem_id = request.GET['poem_id']
    else:
        poem_id = 2066

    poem = (c.get_poem(poem_id))[0]
    user = request.user
    poet_name = c.get_poet_name(poem['poet_id'])[0]['name']
    # add user entry to mongodb
    #c.add_user_entry(user.id, id, poem['name'], poet_name)
    split_context = []
    for row in poem['context']:
        split_context.append({'row_index': row['row_index'],
                              'sadr': row['sadr'].strip().split(' '),
                              'ajuz': row['ajuz'].strip().split(' ')})
    poem['context'] = split_context
    # meta_data = c.get_meta_data(poem.poet_id)
    context = {
        'poems': poem,
        # 'meta': meta_data,
        'title': 'Home',
        'all_tags': all_tags,
        'poem_id': poem_id,
    }
    return render(request, 'main_tag_page.html', context)


def index(request):
    """
    # main page of the website.
    :param request:
    :return:
    """
    filtered_hist = []
    history = []
    if request.user.is_authenticated:
        # if normal user fetch the last 5 visit poems
        c = Connector()
        history = c.get_user_history(request.user.id)[-5:]
        if len(history) == 0:
            history = 'No data'
        else:
            for item in history:
                item['time'] = datetime.fromtimestamp(item['time'])
            history.reverse()
        if request.user.is_superuser:
            # in additional if user is super user , fetch the last 100 entries from all users
            all_history = c.get_all_user_history()[-100:]
            for item in all_history:
                if int(item['user_id']) != int(request.user.id):
                    user = User.objects.get(id=int(item['user_id']))
                    item['user_name'] = user
                    item['time'] = datetime.fromtimestamp(item['time'])
                    filtered_hist.append(item)
            filtered_hist.reverse()

    context = {
        'title': 'Main Page',
        'history': history,
        'all_history': filtered_hist,
    }
    return render(request, 'index.html', context)


@login_required()  # only users view this page
def tags(request):
    """
    # this page responsible for managing the tags hierarchy.
    :param request:
    :return:
    """
    t = Tag()
    all_tags = t.getAllTags()["tags"]
    context = {
        'title': 'Tags',
        'all_tags': all_tags
    }
    return render(request, 'manage_tags.html', context)


@user_passes_test(lambda u: u.is_superuser)  # only superuser can view this page
def settings(request):
    # this page responsible for managing users and database backups
    context = {
        'title': 'Settings',
    }
    return render(request, 'settings.html', context)


@login_required()  # only users view this page
def statistics(request):
    """
     # this page responsible for representing all kind of statistics about the website data bases.
    :param request:
    :return:
    """
    c = Connector()
    periods = c.get_periods()
    poets = c.get_poets()
    frequency = [10, 20, 30, 50, 70, 80, 100, 200, 300, 400, 500, 1000]
    frequency.reverse()
    ranges = ['0-50', '50-100', '100-150', '150-200', '200-250', '250-300', '300-350', '350-400', '400-450',
              '450-500', '500-550', '550-600', '600-650', '650-700', '700-750', '750-800', '800-850', '850-900',
              '900-950', '950-1000']
    reslut = finders.find('images/Analysis/generalInfo.json')
    f = open(reslut)
    json_string = f.read()
    f.close()
    # Convert json string to python object
    data = json.loads(json_string)
    context = {
        'title': 'Statistics',
        'frequency': frequency,
        'info': data[0],
        'range': ranges,
        'periods': periods,
        'poets': poets
    }
    return render(request, 'statistics.html', context)


@login_required()  # only users view this page
def select_poet_page(request):
    """
     # this page responsible for choosing a poem to start tagging.
    :param request:
    :return:
    """
    context = {
        'title': 'Poem selection'
    }
    return render(request, 'select_poet.html', context)


def poet_poems(request):
    """
    # a method to get all poems of a specific poet.
    :param HTTP request: poet id
    :return: STRING of poems for this poet, split by ,
    """
    if request.method == 'GET':
        poetId = request.GET['poet_id']
        c = Connector()
        poems = c.get_poems_by_poet(int(poetId))
        t = Tagging()
        poems_tagged = t.get_Tagged_poems(poems)
        if poems is not None:
            return JsonResponse({
                "poem_ids": poems, "tagged": poems_tagged})
        else:
            return HttpResponse("not found")
    else:
        return HttpResponse("not success")


def save_term_tag(request):
    """
     # this method saves tag for a word.
    :param request: the word and its (position,place,row) , the tag of the word , the poem id
    :return: success or failed
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        # remove term tashkeel and white space
        term = araby.strip_tashkeel(term).strip()
        term = stemmer.stem(term)
        tag = data.get('tag').strip()
        poem_id = data.get('id')
        t = Tagging()
        mutex.acquire()
        try:
            suc = t.tagWord(term, tag, poem_id, int(data.get('place')), int(data.get('row')), int(data.get('position')))
        finally:
            mutex.release()

        if suc:
            return HttpResponse("Success")  # Sending an success response
        else:
            return HttpResponse("not Success")
    else:
        return HttpResponse("not found")


def add_all_suggestions(request):
    """
    # this method to add all the tags in the suggestion window for a specific word .
    :param request: the word and its (position,place,row) , the tag of the word,the poem id.
    :return:
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        # remove term tashkeel and white space
        term = araby.strip_tashkeel(term).strip()
        term = stemmer.stem(term)
        all_tags = data.getlist('tags[]')
        poem_id = data.get('id')
        t = Tagging()
        mutex.acquire()
        d = {}
        try:
            for tag in all_tags:
                suc = t.tagWord(term, tag, poem_id, int(data.get('place')), int(data.get('row')),
                                int(data.get('position')))
                d[tag] = suc
        finally:
            mutex.release()

        return JsonResponse(d)
    else:
        return HttpResponse("not found")


def suggest_tags(request):
    """
    # this method get all suggestion tags of a word.
    :param request: the word and its (position,place,row) , the poem id
    :return: all suggestion and their frequency , empty if there is none.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        # remove term tashkeel and white space
        term = araby.strip_tashkeel(term).strip()
        term = stemmer.stem(term)
        t = Tagging()
        mutex.acquire()
        try:
            suggestions = t.searchTagsOfWord(term, data.get('id'), int(data.get('place')), int(data.get('row')),
                                             int(data.get('position')))
            if len(suggestions) > 0:
                Count = Counter(suggestions)
                total = sum(Count.values())
                freq_percentage = list({k: v / total for k, v in Count.items()}.items())
            else:
                freq_percentage = []
        finally:
            mutex.release()
        if suggestions is not None:
            return JsonResponse({"suggestions": freq_percentage})
        else:
            return HttpResponse("not found")


def get_children(request):
    """
    # get all children of specific tag.
    :param request: tag in the hierarchy.
    :return: the tag children.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        t = Tag()
        children = t.getChildrens(term)
        if children is not None:
            return JsonResponse(children)
        else:
            return HttpResponse("not found")


def get_parent(request):
    """
    Get parent of specific tag.
    :param request:tag in the hierarchy.
    :return: tag parent.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        t = Tag()
        parent = t.getParent(term)
        if parent is not None:
            return JsonResponse(parent)
        else:
            return HttpResponse("not found")


def get_roots(request):
    """
    Get all roots in the hierarchy.
    :param request:
    :return: all roots if success.
    """
    if request.method == 'GET':
        t = Tag()
        roots = t.getAllheads()
        if roots is not None:
            return JsonResponse(roots)
        else:
            return HttpResponse("not found")


def add_root(request):
    """
    Add a new root in the hierarchy.
    :param request: the root to be inserted
    :return: success or fail
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        t = Tag()
        mutex2.acquire()
        try:
            boolean = t.addTag(term)
        finally:
            mutex2.release()
        if boolean is not None:
            return JsonResponse(boolean)
        else:
            return HttpResponse("not found")


def add_tag(request):
    """
    Add new tag to the hierarchy
    :param request: tag and its parent
    :return:success or fail.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        parent = data.get('parent')
        t = Tag()
        boolean = t.addTag(term, parent)
        if boolean is not None:
            return JsonResponse(boolean)
        else:
            return HttpResponse("not found")


def get_brothers(request):
    """
    Get all tags brothers (all tags that's share the same parent as the given tag)
    :param request: the tag
    :return:all tag brothers.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        parent = data.get('parent')
        t = Tag()
        brothers = t.getBrothers(term, parent)
        if brothers is not None:
            return JsonResponse(brothers)
        else:
            return HttpResponse("not found")


def get_depth(request):
    """
    Get the depth of specific tag.
    :param request:the tag in the heirarchy
    :return: depth of tag
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        t = Tag()
        depth = t.findDepth(term)
        if depth is not None:
            return JsonResponse(depth)
        else:
            return HttpResponse("not found")


def remove_tag(request):
    """
    Remove a tag from the hierarchy.
    :param request: the tag in the hierarchy.
    :return: success or fail.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        t = Tag()
        mutex2.acquire()
        try:
            flag = t.removeTag(term)
        finally:
            mutex2.release()
        if flag is not None:
            return JsonResponse(flag)
        else:
            return HttpResponse("not found")


def add_parent(request):
    """
    # add parent for a specific tag.
    :param request: the tag in the hierarchy.
    :return: success or fail.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        parent = data.get('parent')
        t = Tag()
        mutex2.acquire()
        try:
            flag = t.newParent(term, parent)
        finally:
            mutex2.release()
        if flag is not None:
            return JsonResponse(flag)
        else:
            return HttpResponse("not found")


def edit_tag(request):
    """
    # edit tag name
    :param request: tag in the hierarchy.
    :return: success or fail.
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        edit = data.get('edit')
        t = Tag()
        mutex2.acquire()
        try:
            flag = t.editTag(term, edit)
        finally:
            mutex2.release()
        if flag is not None:
            return JsonResponse(flag)
        else:
            return HttpResponse("not found")


def change_parent(request):
    """
    # change parent of specific tag to another tag ( new parent must exist)
    :param request: tag and its parent
    :return:success or fail
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        parent = data.get('parent')
        t = Tag()
        mutex2.acquire()
        try:
            flag = t.changeParent(term, parent)
        finally:
            mutex2.release()
        if flag is not None:
            return JsonResponse(flag)
        else:
            return HttpResponse("not found")


def delete_all(request):
    """
    # delete tag and all of its children from the database.
    :param request: tag in the hierarchy.
    :return: success or fail
    """
    if request.method == 'GET':
        data = request.GET
        term = data.get('term')
        t = Tag()
        mutex2.acquire()
        try:
            flag = t.deleteAllChildrens(term)
        finally:
            mutex2.release()
        if flag is not None:
            return JsonResponse(flag)
        else:
            return HttpResponse("not found")


def get_all_tags(request):
    """
    # get all tags from the database.
    :param request:
    :return: all tags
    """
    if request.method == 'GET':
        t = Tag()
        all_tags = t.getAllTags()
        if all_tags is not None:
            return JsonResponse(all_tags)
        else:
            return HttpResponse("not found")


def get_all_poets(request):
    """
    Given a GET request returns all poets from database.

    :param request:
    :return: JSON response with all poet ids and names looks like:
    {"poet": [{"id": 2, "name": name}, {}....]
    """
    if request.method == 'GET':
        c = Connector()
        poets = c.get_poets()
        if tags is not None:
            return JsonResponse({
                'poets': poets})
        else:
            return HttpResponse("not found")


def get_terms_freq(request):
    """
    # all words with their frequencies for a specific period/all periods with filtered parameters.
    :param request: period or all periods , number to check of we ask for top or range , f for frequency ,
    :return: words with their frequencies
    """
    if request.method == 'GET':
        req = request.GET
        if req.get('p') == "all periods":
            result = finders.find('images/Analysis/TermFreq.json')
        else:
            result = finders.find('images/Analysis/TermFreqperPeriod.json')
        f = open(result)
        json_string = f.read()
        f.close()
        # Convert json string to python object
        data = json.loads(json_string)
        if int(req.get('n')) == 1:
            x = int(req.get('f'))
            if req.get('p') == "all periods":
                d = data[:x]
                current_max = x
            else:
                period = req.get('p').strip()
                if len(data[period]) < x:
                    d = data[period][:len(data[period])]
                    current_max = len(data[period])
                else:
                    d = data[period][:x]
                    current_max = x
            return JsonResponse({"t": d, "m": current_max})
        elif int(req.get('n')) == 2:
            y = req.get('f').strip().split("-")
            if req.get('p') == "all periods":
                d = data[int(y[0]):int(y[1])]
                current_max = int(y[1])
            else:
                period = req.get('p').strip()
                length = len(data[period])
                if int(y[1]) > length:
                    d = data[period][int(y[0]):length]
                    current_max = length
                else:
                    d = data[period][int(y[0]):int(y[1])]
                    current_max = int(y[1])
            return JsonResponse({"t": d, "m": current_max})
        elif int(req.get('n')) == 3:
            if req.get('p') == "all periods":
                d = data[:2000]
            else:
                period = req.get('p').strip()
                d = data[period][:2000]
            return JsonResponse({"t": d})


def maxFrequencyinPeriod(request):
    """
    # get the max number of term in periods or all periods . ( x <= 1000)
    :param request: p for period
    :return: max <=1000
    """
    if request.method == 'GET':
        req = request.GET
        period = req.get('p').strip()
        if period == "all periods":
            return JsonResponse({"max": 1000})
        else:
            result = finders.find('images/Analysis/TermFreqperPeriod.json')
            f = open(result)
            json_string = f.read()
            f.close()
            data = json.loads(json_string)
            return JsonResponse({"max": len(data[period])})


def get_words_analyzation(request):
    """
    When tag page is loaded , get all suggestion words , tagged words and all roots of each word.
    use stemmer and strip tashkel on each word.
    :param request: poem id
    :return: suggestions, tagged  and roots.
    """
    if request.method == 'GET':
        req = request.GET
        poem_id = req.get('id')
        w = Tagging()
        currentTagged = w.get_tagged_words_from_poem(poem_id)
        c = Connector()
        poem = (c.get_poem(poem_id))[0]
        l = " "
        dictionary = {}
        root_of_words = {}
        for row, j in enumerate(poem["context"]):
            s = ""
            if 'sadr' in j:
                for pos, word in enumerate(j['sadr'].split()):
                    temp = stemmer.stem(araby.strip_tashkeel(word))
                    root_of_words[word] = temp
                    position = pos + 1
                    dict_row = row + 1
                    if temp in dictionary:
                        dictionary[temp].append(dict(row=dict_row, sader=0, position=position))
                    else:
                        dictionary[temp] = [dict(row=dict_row, sader=0, position=position)]
                    s += temp + " "
                # s += stemmer.stem(araby.strip_tashkeel(j['sadr'])) + " "
            if 'ajuz' in j:
                for pos, word in enumerate(j['ajuz'].split()):
                    temp = stemmer.stem(araby.strip_tashkeel(word))
                    root_of_words[word] = temp
                    position = pos + 1
                    dict_row = row + 1
                    if temp in dictionary:
                        dictionary[temp].append(dict(row=dict_row, sader=1, position=position))
                    else:
                        dictionary[temp] = [dict(row=dict_row, sader=1, position=position)]
                    s += temp + " "
            l += s
        tokens = re.findall(r"[\w']+", l)
        suggestion = []
        for s in w.get_suggestions(tokens):
            suggestion += dictionary.get(s["word"])
        # suggestion.append(dictionary[s])
        return JsonResponse({"tagged": currentTagged, "suggested": suggestion, "roots": root_of_words})


@login_required()
def get_history_user(request):
    """
    :param request: gets the user's id
    :return: the user's history
    """
    if request.method == 'GET':
        c = Connector()
        history = c.get_user_history(request.user.id)[-5:]
        for item in history:
            item['time'] = datetime.fromtimestamp(item['time'])
        history.reverse()
        return JsonResponse({'data': history})


def term_current_tags(request):
    """
    # get all tags of a word.
    :param request: the word and its (position,place,row), the poem id
    :return: all word tags
    """
    if request.method == 'GET':
        req = request.GET
        w = Tagging()
        term = araby.strip_tashkeel(req.get('term')).strip()
        term = stemmer.stem(term)
        currentTagged = w.get_term_current_tags(int(req.get('row')), int(req.get('place')), int(req.get('position')),
                                                req.get('id'), term)
        return JsonResponse({"tags": currentTagged})


def remove_tag_from_word(request):
    """
    Remove a tag from word.
    :param request:the word and its (position,place,row) , the tag of the word , the poem id
    :return: success or fail
    """
    if request.method == 'GET':
        req = request.GET
        w = Tagging()
        suc = w.remove_tag_reletion(int(req.get('row')), int(req.get('place')), int(req.get('position')), req.get('id'),
                                    req.get('tag'))
        return JsonResponse(suc)


def get_Root_of_Word(request):
    """
    Root of a specific word using the farasa stemmer
    :param request: word
    :return: root
    """
    if request.method == 'GET':
        req = request.GET
        term = araby.strip_tashkeel(req.get('word')).strip()
        r = stemmer.stem(term)
        return JsonResponse({"root": r})


def edit_poem_line(request):
    """
    Given 1. poem id 2. line number 3. sadr text 4. ajuz text, change this line number in this poem to the given text

    :param request: GET request with the four arguments.
    :return: success or failure based on status.
    """
    if request.method == 'GET':
        data = request.GET
        poem_id, line, asdr, ajuz = data.get('id'), data.get('line'), data.get('sadr'), data.get('ajuz')


def get_Tags_frequency_in_poem(request):
    """
    # get all tags in specific poem.
    :param request: poem id
    :return: all tags and their total number.
    """
    if request.method == 'GET':
        data = request.GET
        t = Tagging()
        result, total = t.get_all_tagged_words_in_Poem(data.get('id'))
        return JsonResponse({'tags': result, 'total': total})


def get_all_tags_for_poet(request):
    """
    # get all tags in each poem that's belong to specific poet.
    :param request: poet id
    :return:  all tags , total number of all tags
    """
    if request.method == 'GET':
        data = request.GET
        t = Tagging()
        c = Connector()
        poems = c.get_poems_by_poet(int(data.get('id')))
        result, total = t.get_all_tags_for_poet(poems)
        return JsonResponse({"tags": result, 'total': total})


# use this lock when u need to write on the database, some function that are read may need this mutex in order to avoid
# incorrect data when someone writing in parallel
# muted for tag-word relation , mutex2 for tag hierarchy management only
mutex = Lock()
mutex2 = Lock()