from py2neo import Graph, Node

"""
    this class responsible for  managing the words and its tags connections.
"""


class Tagging(object):
    def __init__(self):
    
        """
            connector and cypher query.
            require knowledge of cypher language.
        """
        self.graph = Graph("bolt://localhost:7687", auth=("neo4j", "123123147"))
        self.getMaxIDQ1 = """ Match (w:Word) return Max(tointeger(w.id)) as max """
        self.getMaxIDQ2 = """ Match (t:Tag) return Max(tointeger(t.id)) as max """
        self.searchQ1 = """ Match (w:Word) where w.name=$name return w.name as name """
        self.searchQ2 = """ Match (t:Tag) where t.name=$name return t.name as name  """
        self.searchQ3 = """ Match (w:Word)-[r:tag]->(t:Tag) where t.name=$tag and w.name=$word and r.poemID=$poem and r.sader=$sader and r.position=$position and r.row=$row return r  """
        self.createReletionQ = """ Match (w:Word) ,(t:Tag) where w.name=$word and t.name=$tag create (w)-[:tag{position: $position,poemID: $poem,row : $row,sader : $sader}]->(t) """
        self.removeWordQ = """ Match (w:Word) where w.name=$word detach delete w """
        self.getTagOfWordQ =""" match (w1:Word)-[r1:tag]->(t1:Tag) where w1.name=$word with collect(t1.name) as alltags
                                optional match (w:Word)-[r:tag]->(t:Tag) where r.poemID=$poem and r.sader=$place and r.position=$position and r.row=$row with alltags ,collect(t.name) as temp 
                                return [x IN alltags where not x in temp] as list
                            """
        self.checkWords = """match (:Tag)<-[r:tag]-(w:Word) where  r.poemID=$poem  return distinct r.position as position,r.row as row , r.sader as sader """
        self.checkpoems = """ match (:Tag)<-[r:tag]-(:Word) where r.poemID in $poems return distinct r.poemID as poemID """
        self.tagsOfword = """ match (t:Tag)<-[r:tag]-(w:Word) where r.poemID = $poem and w.name=$word and r.sader = $place and r.position = $position and r.row = $row return t.name as tag"""
        self.removeTagrelationQ = """ match(t:Tag)<-[r:tag]-(w:Word) where t.name =$tag and r.poemID = $poem and r.sader = $place and r.position = $position and r.row = $row  delete r return w.name as name"""
        self.suggestionQ = """ match(:Tag)<-[r:tag]-(w:Word) where w.name in $words return distinct w.name as word"""
        self.checkremainingRelations = """ match(:Tag)<-[r:tag]-(:Word) where r.poemID = $poem and r.sader = $place and r.position = $position and r.row=$row return count(r) as count"""
        self.removeWordwithoutr = """match (w:Word) where w.name=$word and not (w)--() delete (w)"""
        self.getAllTaggedWords =""" Match (w:Word) -[r:tag]-> (t:Tag) where r.poemID= $poem with  t , count(r) as c 
                                        return {name :t.name  , frequency: c } as Tag order by c Desc """
        self.allTagsInPoems = """ Match (w:Word) -[r:tag]-> (t:Tag) where r.poemID in $poems with  t , count(r) as c 
                                        return {name :t.name  , frequency: c } as Tag order by c Desc"""

    def ifExists(self, word=None, tag=None, ):
        """
         # check if a word or tag exist in the db but not both .
         # used only in this class
        """
        if tag is None:
            s = self.graph.run(self.searchQ1, name=word).data()
        else:
            s = self.graph.run(self.searchQ2, name=tag).data()
        if len(s) == 0:
            return False
        return True

    def ifReleationExist(self, word, tag, poem, sader, row, position):
        """
         # check of this a relation between tag and word exist based on the input parameters.
         # used only in this class
        """
        s = self.graph.run(self.searchQ3, word=word, tag=tag, sader=sader, row=row, poem=poem, position=position).data()
        if len(s) == 0:
            return False
        return True

    def tagWord(self, word, tag, poemID, place, row, position):
        """
        # sader or ajez , tag must exist.
        # if tag doesn't exist , we create a new one(optional we can remove it )
        # create a relation between tag and word based on poem Id , row and the position of the word in the poem.
        :param word: name of the word.
        :param tag: name of the tag.
        :param poemID: stand for the id of the poem that the word being tagged in.
        :param sader : 0 for sader , 1 for ajez.
        :param row: the row which the word exist.
        :param position: stand for the word position in the poem.
        :return:
        """
        if place not in (0, 1):
            return False
        if not self.ifExists(tag=tag):
            return False
        if not self.ifExists(word=word):
            temp = self.graph.run(self.getMaxIDQ1).data()[0]["max"]
            if temp is None:
                maxID1 = 1
            else:
                maxID1 = temp + 1
            self.graph.create(Node("Word", id=maxID1, name=word))
        if not self.ifReleationExist(word, tag, poemID, place, row, position):
            self.graph.run(self.createReletionQ, word=word, tag=tag, sader=place, row=row, poem=poemID,
                           position=position)
            return True
        return False

    def removeWord(self, word):
        """
        # check if a word exists and remove it with all relationships.
        :param word: name of the word
        :return:
        """
        if not self.ifExists(word=word):
            return False
        self.graph.run(self.removeWordQ, word=word)
        return True

    def searchTagsOfWord(self, word , poem , place , row , position):
        """
        # get all the tags of given word based on its position in poem .
        :param word: name of the word.
        :param poem: id of the poem
        :param place: 0 for sader , 1 for ajez.
        :param row: the row which the word exist.
        :param position: stand for the word position in the poem.
        :return:
        """
        if not self.ifExists(word=word):
            return []
        search = self.graph.run(self.getTagOfWordQ, word=word , poem = poem , place = place , row = row , position = position).data()
        if len(search) == 0:
            return []
        else :
            return search[0]["list"]

    def get_tagged_words_from_poem(self, id):
        """
        # extract all word positions from the required poem thats have at least a tag.
        # if none being tagged before the return is empty list.
        :param id: id of the poem.
        :return:
        """
        check = self.graph.run(self.checkWords, poem=id).data()
        l = []
        for d in check:
            l.append(d)
        return l

    def get_Tagged_poems(self,poems):
        """
        # return all the poems that's had been tagged before from a specific list of poems id.
        # if none meet the conditions , return empty list.
        :param poems: list of poems id
        :return:
        """
        l = []
        for p in poems :
            l.append(p["id"])
        return self.graph.run(self.checkpoems, poems = l).data()

    def get_term_current_tags(self ,row ,place ,position ,id , term):
        """
        # get a all tags of term that's reside in specific poem .
        :param row:
        :param place:
        :param position:
        :param id:
        :return:
        """
        return self.graph.run(self.tagsOfword, poem = id , row=row , position= position , place = place , word=term).data()

    def remove_tag_reletion(self,row ,place ,position ,id ,tag):
        """
        # remove the relations between specific term and tag.
        # because the term is unique only 1 relations is removed.
        # in order to avoid keeping words without tags(in case we remove the last relations of word) ,check if the words
            have no relations and delete it.
        :param row:
        :param place:
        :param position:
        :param id:
        :param tag:
        :return:
        """
        if not self.ifExists(tag=tag):
            return {"exist":False}
        word = self.graph.run(self.removeTagrelationQ, poem=id, row=row, position=position, place=place , tag = tag).data()[0]
        self.graph.run(self.removeWordwithoutr , word = word["name"])
        c = self.graph.run(self.checkremainingRelations, poem=id, row=row, position=position, place=place , tag = tag).data()[0]
        if c['count'] == 0:
            return {"exist":True ,"last":True}
        return {"exist":True ,"last":False}


    def get_suggestions(self, array):
        """
        # return all words that's have been tagged at least once .
        :param array: list of words
        :return:
        """
        return self.graph.run(self.suggestionQ,words = array).data()

    def get_all_tagged_words_in_Poem(self,poemID):

        result = self.graph.run(self.getAllTaggedWords, poem=poemID).data()
        total = 0
        if len(result) > 0:
            for t in result:
                total+= t['Tag']['frequency']
        return result , total

    def get_all_tags_for_poet(self,all_poems):
        arr=[]
        for p in all_poems:
            arr.append(p['id'])
        result = self.graph.run(self.allTagsInPoems, poems=arr).data()
        total = 0
        if len(result) > 0:
            for t in result:
                total += t['Tag']['frequency']
        return result, total
