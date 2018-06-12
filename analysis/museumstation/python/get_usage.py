## remember to run conn_cocolab from the terminal before running cells in this notebook!

## libraries
from __future__ import division

import os
import urllib, cStringIO

import matplotlib
from matplotlib import pylab, mlab, pyplot
from IPython.core.pylabtools import figsize, getfigs
plt = pyplot
import seaborn as sns
sns.set_context('poster')
sns.set_style('white')

import numpy as np
import scipy.stats as stats
import pandas as pd
import json
import re

from PIL import Image
import base64
import datetime
from datetime import datetime
from dateutil import tz

# import schedule
# import time

# set up 
iterationName = 'cdm_run_v3'
exp_path = 'museumstation'

auth = pd.read_csv('auth.txt', header = None) # this auth.txt file contains the password for the sketchloop user
pswd = auth.values[0][0]
user = 'sketchloop'
host = 'rxdhawkins.me' ## cocolab ip address


import pymongo as pm
conn = pm.MongoClient('mongodb://sketchloop:' + pswd + '@127.0.0.1')
db = conn['kiddraw']
coll = db['cdm_run_v3']

# number of  sessions
valid_sessions = coll.find().distinct('sessionId')

# get raw image indexes (INCLUDING PRACTICE AND WEIRD ONES)
image_recs = coll.find({'$and': [{'dataType':'finalImage'}]})

# output number of images
numImages = image_recs.count()
lastImage = image_recs[numImages - 1]

## get date and 
lastestDate = lastImage['date']
#convert time zone.... needs debuggin.
# utc = datetime.strptime(lastestDate, '%Y-%m-%d %H:%M:%S')
# to_zone = utc.tzlocal()
# latestDate_PST = utc.astimezone(to_zone)


print 'We currently have {} valid sessions from {}.'.format(len(valid_sessions), iterationName)
print 'We currently have {} drawings from {}.'.format(numImages, iterationName)
print 'The last drawing was made at {}.'.format(lastestDate)


