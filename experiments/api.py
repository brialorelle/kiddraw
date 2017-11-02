import StringIO
import copy
import collections

import base64
import gridfs

import hashlib
import tempfile
import json
import os
import numpy as np
import bson.json_util as json_util
from bson.objectid import ObjectId
import cPickle
import pandas as pd

import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.autoreload
from tornado.options import define, options

import pymongo as pm

define("port", default=8880, help="run on the given port", type=int)
print('ready to connect')

class App(tornado.web.Application):
    """
        Tornado app which serves the API.
    """
    def __init__(self):
        handlers = [(r"/saveresponse",SaveResponseHandler)]
        settings = dict(debug=True)
        tornado.web.Application.__init__(self, handlers, **settings)


class BaseHandler(tornado.web.RequestHandler):
    def get(self):
        args = self.request.arguments
        for k in args.keys():
            args[k] = args[k][0]
        args = dict([(str(x),y) for (x,y) in args.items()])  

        callback = args.pop('callback', None)   
        
        resp = json.dumps(self.get_response(args))        

        if callback:
            self.write(callback + '(')
        self.write(json.dumps(resp, default=json_util.default))   
        if callback:
            self.write(')')
        print('sending!')
        self.finish()
  

auth = pd.read_csv('auth.txt', header = None) # this auth.txt file contains the password for the sketchloop user
PASSWORD = auth.values[0][0]
MONGO_PORT = 20809
CONN = pm.MongoClient('mongodb://sketchloop:{}@127.0.0.1:{}/'.format(PASSWORD,MONGO_PORT))  

DB_DICT = {}
FS_DICT = {}      
        
class SaveResponseHandler(BaseHandler):  
    def get_response(self,args):
        return save_response(self,args)

def save_response(handler,args):
    imhash = hashlib.sha1(json.dumps(args)).hexdigest()
    print("imhash", imhash)
    filestr = 'filestr'
    global CONN
    dbname = args['dbname']
    colname = args['colname']
    global DB_DICT
    if dbname not in DB_DICT:
        DB_DICT[dbname] = CONN[dbname]
    db = DB_DICT[dbname]
    global FS_DICT
    if (dbname, colname) not in FS_DICT:
        FS_DICT[(dbname, colname)] = gridfs.GridFS(db, colname)
    fs = FS_DICT[(dbname, colname)]    
    print args
    _id = fs.put(filestr, **args) # actually put file in db


def main():
    """
        function which starts up the tornado IO loop and the app. 
    """
    tornado.options.parse_command_line()
    ioloop = tornado.ioloop.IOLoop.instance()
    http_server = tornado.httpserver.HTTPServer(App(), max_header_size=10000000)
    http_server.listen(options.port)
    tornado.autoreload.start()
    ioloop.start()
    

if __name__ == "__main__":
    main()

