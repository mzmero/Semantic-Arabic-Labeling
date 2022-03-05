import csv
from py2neo import Graph, Node, Relationship
'''
this class is only for one use , transfer all data from csv to neo4j .
neo4j db must be active.
database.csv have the basic tags for creating tag class in neo4j.
'''


class Tag(object):
    """
    # a simple class that represent a tag.
    @number = the unique id of this tag.
    @name = the name of this tag.
    @parent = the parent id of this tag.
    """

    def __init__(self, number, name, parent):
        self.number = number
        self.name = name
        self.parent = parent


graph = Graph("bolt://localhost:7687", auth=("neo4j", "123123147"))
nodes = []
line = 0
# read csv data and create tag objects
with open('dataset.csv', 'r', encoding="utf8") as f:
    reader = csv.reader(f)
    for row in reader:
        if line != 0:
            nodes.append(Tag(number=row[0], name=row[1], parent=row[2]))
            # line=line+1
        else:
            line = line + 1
# define a relation name between tags.
p = Relationship.type("Parent")

# connect to neo4j db and insert each tag and their relationships.
for parent in nodes:
    for child in nodes:
        if parent.number == child.parent and parent.name != child.name:
            graph.merge(p(Node("Tag", id=parent.number, parent=parent.parent, name=parent.name),
                          Node("Tag", id=child.number, parent=child.parent, name=child.name)), "Tag", "name")

# cast id and parent to int.
Q = """ Match (n) set n.parent=toInteger(n.parent) , n.id=toInteger(n.id) """
graph.run(Q).data()
