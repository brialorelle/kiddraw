
## basic library requirements
from __future__ import division

import os
import urllib, cStringIO

import numpy as np
import scipy.stats as stats
import pandas as pd
import json
import re

from PIL import Image
import base64
import datetime
import time

# set path to database connectinos 
auth = pd.read_csv('auth.txt', header = None) 
pswd = auth.values[0][0]

## use pymongo for database
import pymongo as pm
conn = pm.MongoClient('mongodb://stanford:' + pswd + '@127.0.0.1')
db = conn['kiddraw']
cdm_run_v8 = db['cdm_run_v8']
cdm_run_v7 = db['cdm_run_v7']
cdm_run_v6 = db['cdm_run_v6']
cdm_run_v5 = db['cdm_run_v5']
cdm_run_v4 = db['cdm_run_v4']
cdm_run_v3 = db['cdm_run_v3']

###### ###### ###### TOGGLE HERE WHICH DATABSE
this_collection = cdm_run_v3
which_run = 'cdm_run_v3'
###### ###### ###### ######

###### Where are we rendering these sketches?
analysis_dir = os.getcwd()
sketch_dir = os.path.join(analysis_dir,'sketches_full_dataset')
if not os.path.exists(sketch_dir):
    os.makedirs(sketch_dir)

output_dir = os.path.join(analysis_dir,'sketches_descriptives')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

###### Open up variables for CSV writing
# basic descriptors
session_id = []; trial_num = []; category = []; age = []; filename = []

# stroke times and duration
draw_duration_old = []; draw_duration_new = []

# drawing usage stats
num_strokes = []
mean_intensity = []
bounding_box = []

# trial time and duration
start_time = []; submit_time = []; trial_duration = []

# other timing variables
submit_date = []
submit_date_readable = []


###### Define functions for use below in getting img intensities and bounding boxes
def load_image_data(imgData,imsize):
    filestr = base64.b64decode(imgData)
    fname = os.path.join('sketch.png')
    with open(fname, "wb") as fh:
        fh.write(imgData.decode('base64'))
    im = Image.open(fname).resize((imsize,imsize))
    _im = np.array(im)
    return(_im)

def get_mean_intensity(img,imsize):
    thresh = 250
    numpix = imsize**2
    mean_intensity = len(np.where(img[:,:,3].flatten()>thresh)[0])/numpix
    return mean_intensity
    
def get_bounding_box(img):
    rows = np.any(img, axis=1)
    cols = np.any(img, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    bounding_box = tuple((rmin, rmax, cmin, cmax))
    return bounding_box

######MASSIVE LOOP TO RENDER OUT IMAGES & INFO
# basic variables for counting throughout the loop
skipCount = 0;
writeImageCount = 0;
interferenceCount = 0;
timeSave = []
imsize = 224 ## img writing size, optimized for CNN
countImage = 0

## Get all sessions within this collection
sessions_to_render =  this_collection.find({'$and': [{'dataType':'finalImage'}]}).distinct('sessionId')
time_start = time.time() ## 

## Go through each session
for s in sessions_to_render:        
    # in the latest version of museumstation (cdm_run_v4), more info on timing and survey for exclusions
    if (this_collection != cdm_run_v3):

        image_recs = this_collection.find({'$and': [{'sessionId':s}, {'dataType':'finalImage'}]}).sort('startTrialTime')    
        
        ## get survey data for this kid (if it exists), use to exclude
        survey_session = this_collection.find({'$and': [{'dataType':'survey'},{'sessionId':s}]})
        if survey_session.count()>0:
            interference = (survey_session[0]['other_drew']==True | survey_session[0]['parent_drew']==True)
        else:
            interference = False
        
        if interference==True:
            interferenceCount = interferenceCount+1
            if np.mod(interferenceCount,10)==0:
                print('excluded {} kids for reported inference...'.format(interferenceCount))

    elif (this_collection == cdm_run_v3):
        image_recs = this_collection.find({'$and': [{'sessionId':s}, {'dataType':'finalImage'}]}).sort('time')    
        interference = False

    ## if they made it past the practice trials & no reported interference
    if image_recs.count()>3 & interference==False: 
            for imrec in image_recs:                                                            
                category_dir = os.path.join(sketch_dir,imrec['category'])
                if not os.path.exists(category_dir):
                    os.makedirs(category_dir)
                # filename
                fname = os.path.join(category_dir,'{}_sketch_{}_{}.png'.format(imrec['category'], imrec['age'],imrec['sessionId']))
                

                ## if this image exists already, skip it
                if os.path.isfile(fname):
                    skipCount = skipCount + 1;
                    if np.mod(skipCount,100)==0:
                        print('Weve skipped {} images...'.format(skipCount))
                        if (this_collection != cdm_run_v3):
                            timeSave.append(imrec['startTrialTime']) 
                        elif (this_collection == cdm_run_v3):
                            timeSave.append(imrec['time']) 
                else:
                    ## timing info was different in different collections, switch here
                    if (this_collection != cdm_run_v3): 
                        stroke_recs = this_collection.find({'$and': [{'sessionId':s}, 
                                          {'dataType':'stroke'},
                                          {'trialNum': imrec['trialNum']}]}).sort('startTrialTime')   
                    elif (this_collection == cdm_run_v3):
                        stroke_recs = this_collection.find({'$and': [{'sessionId':s}, 
                                          {'dataType':'stroke'},
                                          {'trialNum': imrec['trialNum']}]}).sort('time')  

                    # don't do adults for now or blank images
                    if stroke_recs.count()>0 and imrec['age']!='adult': 
                        
                        countImage = countImage + 1;
                        if countImage <0:
                            if np.mod(countImage,100)==0:
                                print('skipped {} images'.format(countImage))
                        else:
                            ## Append session ID, trial Num, category, age                            
                            session_id.append(imrec['sessionId'])        
                            trial_num.append(imrec['trialNum']) 
                            category.append(imrec['category'])
                            age.append(imrec['age'])
                            filename.append(os.path.join(sketch_dir,'{}_sketch_{}_{}.png'.format(imrec['category'], imrec['age'],imrec['sessionId'])))
                            
                            ## again, regularize based on timing info change
                            if (this_collection != cdm_run_v3):
                                start_time.append(imrec['startTrialTime'])
                                submit_time.append(imrec['endTrialTime'])
                                trial_duration.append((imrec['endTrialTime'] - imrec['startTrialTime'])/1000.00)
                                readadble_date = datetime.datetime.fromtimestamp(imrec['endTrialTime']/1000.0).strftime('%Y-%m-%d %H:%M:%S.%f')

                            elif (this_collection == cdm_run_v3):
                                start_time.append('NaN')
                                submit_time.append(imrec['time'])
                                trial_duration.append('NaN')
                                readadble_date = datetime.datetime.fromtimestamp(imrec['time']/1000.0).strftime('%Y-%m-%d %H:%M:%S.%f')

                            ## readable date (not just time, has other info for sanity cecks)
                            submit_date_readable.append(readadble_date)
                            submit_date.append(imrec['date'])
                            
                            ## Count number of strokes and timing information as well on stroke basis
                            num_strokes.append(stroke_recs.count())
                            _svg_end_times = []
                            _svg_start_times = []
                            for strec in stroke_recs:
                                if (this_collection != cdm_run_v3):
                                    _svg_end_times.append(strec['endStrokeTime'])
                                    _svg_start_times.append(strec['startStrokeTime'])
                                elif (this_collection == cdm_run_v3):
                                    _svg_end_times.append(strec['time'])
            
                            ## draw duration
                            if (this_collection != cdm_run_v3):
                                draw_duration_new.append((_svg_end_times[-1] - _svg_start_times[0])/1000) ## in seconds
                            elif (this_collection == cdm_run_v3):
                                draw_duration_new.append('NA') 

                            draw_duration_old.append((_svg_end_times[-1] - _svg_end_times[0])/1000) ## in seconds

                            
                            ## get bounding box and mean pixel intensity
                            this_image = load_image_data(imrec['imgData'],imsize)
                            
                            this_intensity = get_mean_intensity(this_image,imsize)
                            if this_intensity>0:
                                this_bounding_box = get_bounding_box(this_image)
                            else:
                                this_bounding_box= tuple((0,0,0,0,))
                            #
                            bounding_box.append(this_bounding_box)
                            mean_intensity.append(this_intensity)
                            
                            ## Write out image data
                            imgData = imrec['imgData'];
                            writeImageCount = writeImageCount+1
                            
                            with open(fname, "wb") as fh:
                                fh.write(imgData.decode('base64')) 
                                 
                            if np.mod(writeImageCount,10)==0:
                                print('writing images!') # sanity check script is working
                                
                            if np.mod(writeImageCount,100)==0:
                                time_now = time.time() 
                                time_spent_sec = (time_now - time_start)
                                time_spent = time_spent_sec/60
                                print('Weve written {} images at in {} minutes '.format(writeImageCount, time_spent))

                                ## write out csv every 1000 images
                                # X_out = pd.DataFrame([session_id,trial_num,category,age,submit_time,submit_date,num_strokes,draw_duration_old,draw_duration_new,trial_duration, mean_intensity, bounding_box, filename])
                                # X_out = X_out.transpose()
                                # X_out.columns = ['session_id','trial_num','category','age','submit_time','submit_date','num_strokes','draw_duration_old','draw_duration_new','trial_duration','mean_intensity','bounding_box','filename']
                                # X_out.to_csv(os.path.join(output_dir,'MuseumStation_AllDescriptives_{}_images_{}.csv'.format(writeImageCount, which_run)))

## and at the very end, do this as well
X_out = pd.DataFrame([session_id,trial_num,category,age,submit_time,submit_date,num_strokes,draw_duration_old,draw_duration_new,trial_duration, mean_intensity, bounding_box, filename])
X_out = X_out.transpose()
X_out.columns = ['session_id','trial_num','category','age','submit_time','submit_date','num_strokes','draw_duration_old','draw_duration_new','trial_duration','mean_intensity','bounding_box','filename']
X_out.to_csv(os.path.join(output_dir,'MuseumStation_AllDescriptives_{}_images_final_{}.csv'.format(writeImageCount,which_run)))   