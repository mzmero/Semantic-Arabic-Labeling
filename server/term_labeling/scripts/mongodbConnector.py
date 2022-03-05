import pymongo
import time

"""  
   Connector class, pre-made to ease the access to the mongodb database, 
   in order for this class to work, the database must be up and running
"""


class Connector:
    def __init__(self):
        """
        Initiates the connections to mongoDB and the relevant tables.
        """
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client["arabic_semantic_labeling"]
        self.poemsCollections = self.db["poems"]
        self.poetsCollections = self.db["poets"]
        self.periodsCollections = self.db["period"]
        self.userHistoryCollections = self.db["userHistory"]

    def get_poem(self, poemID):
        """
        :param poemID: poem id.
        :return: dictionary with relevant poem from poems db, it has title, sadr, ajuz...
        """
        return list(self.poemsCollections.find({"id": str(poemID)}))

    def get_poet_name(self, poet_id):
        """
        :param poet_id: poet id.
        :return: dictionary with poet name from poets db.
        """
        return list(self.poetsCollections.find({"id": poet_id}, {"_id": 0, 'name': 1}))

    def get_poems_by_poet(self, poet_id):
        """
        :param poet_id: poet id.
        :return: dictionary with ids and names of poems by this poet.
        """
        return list(self.poemsCollections.find({"poet_id": poet_id}, {"_id": 0, "id": 1, "name": 1}))

    def get_poets(self):
        """
        :return: dictionary with all poets in db - their name and id.
        """
        return list(self.poetsCollections.find({}, {"_id": 0, "info": 0, "place": 0, "whoAdded": 0, "period": 0}))

    def get_poems(self):
        """
        :return: dictionary of all poems in db, their title and id (no content).
        """
        return list(self.poemsCollections.find({}, {"_id": 0, "context": 0}))

    def get_poems_context(self):
        """
        :return: dictionary of all poems in db, their title, id and context.
        """
        return list(self.poemsCollections.find({}, {"_id": 0, "context": 1}))

    def get_periods(self):
        """
        :return: returns all periods.
        """
        return list(self.poetsCollections.distinct("period"))

    def get_poems_by_period(self, p):
        """
        :param p: period.
        :return: dictionary of all poems with this period.
        """
        # myquery = {"period": p}
        # x = self.poetsCollections.find(myquery, {"_id":0,"id": 1})
        result = self.poetsCollections.aggregate([
            {"$match": {"period": p}},
            {'$unset': ["_id", "name", "info", "place", "whoAdded", "period"]},
            {'$lookup': {'from': 'poems', 'let': {'id': "$id"},
                         'pipeline': [{"$match": {"$expr": {"$eq": ["$poet_id", "$$id"]}}},
                                      {'$project': {'_id': 0, 'context': {'sadr': 1, 'ajuz': 1}}}],
                         'as': 'results'}}])
        return list(result)

    def add_user_entry(self, user_id, poem_id, poem_name, poet_name):
        """
        Save user entry to this poem, save the poem meta data, user id and timestamp in userHistory db.

        :param user_id: user id as its given by django.
        :param poem_id: poem id.
        :param poem_name: poem title.
        :param poet_name: poet name.
        """
        _dict = {'user_id': user_id, 'poem_id': poem_id, 'time': time.time(), 'poem_title': poem_name,
                 'poet_name': poet_name}
        self.userHistoryCollections.insert_one(_dict)

    def get_user_history(self, user_id):
        """
        :param user_id: user id.
        :return: dictionary of this user's history.
        """
        return list(self.userHistoryCollections.find({'user_id': user_id}, {'_id': 0, 'poem_id': 1, 'time': 1,
                                                                            'poem_title': 1, 'poet_name': 1}))

    def get_all_user_history(self):
        """
        :return: all the users history.
        """
        return list(self.userHistoryCollections.find({}, {'poem_id': 1, 'time': 1, 'poem_title': 1, 'poet_name': 1,
                                                          'user_id': 1}))


if __name__ == "__main__":
    c = Connector()
