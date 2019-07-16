
## libraries
import pandas as pd
import time
import pymongo as pm
import os

# set input parameters
iterationName = 'cdm_run_v5'
num_hours = 200

# set up  connections
auth = pd.read_csv('../../auth.txt', header = None) # this auth.txt file contains the password for the sketchloop user
pswd = auth.values[0][0]
conn = pm.MongoClient('mongodb://stanford:' + pswd + '@127.0.0.1')
db = conn['kiddraw']
coll = db[iterationName]

#
current_milli_time = lambda: int(round(time.time() * 1000))
x_hours_ago = current_milli_time() - (num_hours*60*60*1000)


# get image recs and sessions since certain date
image_recs = coll.find({'$and': [{'dataType':'finalImage'}, {'endTrialTime': {"$gt": x_hours_ago}}]})
valid_sessions = coll.find({'endTrialTime': {"$gt": x_hours_ago}}).distinct('sessionId')

# get count and label fior number of images
numImages = image_recs.count()
lastImage = image_recs[numImages - 1]

## get date from most recent image
lastestDate = lastImage['date']

# fiveImagesAgo = image_recs[numImages - 5]
# recentDate = fiveImagesAgo['date']


print 'In the past {} hours, we have {} valid sessions from {} with {} drawings.'.format(num_hours, len(valid_sessions), iterationName, numImages)
print 'The last drawing was made at {}.'.format(lastestDate)


