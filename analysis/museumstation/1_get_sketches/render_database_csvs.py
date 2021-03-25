## basic library requirements
from __future__ import division

import os
import urllib, cStringIO

import numpy as np
import scipy.stats as stats
import pandas as pd
import json
import re
import argparse

from PIL import Image
import base64
import datetime
import time

# set path to database connectinos 
auth = pd.read_csv('../auth.txt', header = None) 
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


###### Where are we saving
analysis_dir = os.getcwd()

output_dir = os.path.join(analysis_dir,'full_dataset_info')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)


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

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--which_run', type=str, help='name of cdm run', default='cdm_run_v5')
    parser.add_argument('--which_category', help='full name of category', default='a lamp')
    args = parser.parse_args()
    which_run = args.which_run
    this_collection = db[which_run]
    which_category = args.which_category
    c = which_category
    # category_index = pd.to_numeric(args.which_category_index)
    

    ## Get all sessions within this collection
    sessions_this_coll =  this_collection.find({'$and': [{'dataType':'finalImage'}]}).distinct('sessionId')
    valid_meta_data = pd.read_csv('../../../data/drawings/stringent_cleaned_dataset_meta/all_object_metadata_cleaned.csv')
    valid_sessions_df = valid_meta_data.loc[valid_meta_data.category == which_category]
    # valid_category_sessions = valid_sessions_df.session_id
    # valid_category_sessions.columns= ['session_id']
    # now sessions for this run
    # sessions_this_coll = pd.DataFrame(sessions_this_coll)
    # sessions_this_coll.columns = ['session_id']
    # sessions_to_render = pd.merge(sessions_this_coll, valid_sessions, how ='inner', on =['session_id']) 
    sessions_to_render = valid_sessions_df
    print('we have {} unique kids'.format(len(sessions_to_render)))
    # categories =  this_collection.find({'$and': [{'dataType':'finalImage'}]}).distinct('category')
    # c = categories[category_index]
    
    # for c in categories[category_index]:
    
    time_start = time.time() ## 
    print('Saving drawings for {} for {}, started at {}'.format(c, which_run, time_start))

    ###### Clear/open up variables for CSV writing
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

    # svgs and ims
    svgs = []
    ims = []

    # other timing variables
    submit_date = []
    submit_date_readable = []
    # 
    count_session = 0

    # for testing

    for s in sessions_to_render['session_id']:  
    	count_session = count_session + 1
    	mins_elapsed = (time.time() - time_start) / 60
    	if (count_session%10==0):
        	print('session {} of {}, {} minutes since we started').format(count_session, len(sessions_to_render),mins_elapsed)
   	
        image_recs = this_collection.find({'$and': [{'sessionId':s}, {'category':c}, {'dataType':'finalImage'}]}).sort('time')    
    	

        for imrec in image_recs: 
            # open up svgs for THIS image
            _svg_per_image = []

            ## timing info was different in different collections, switch here
            if (this_collection != cdm_run_v3): 
                stroke_recs = this_collection.find({'$and': [{'sessionId':s}, 
                                  {'dataType':'stroke'},
                                  {'trialNum': imrec['trialNum']}]}).sort('startTrialTime')   
            elif (this_collection == cdm_run_v3):
                stroke_recs = this_collection.find({'$and': [{'sessionId':s}, 
                                  {'dataType':'stroke'},
                                  {'trialNum': imrec['trialNum']}]}).sort('time')  

            if stroke_recs.count()>0:
                ## Append session ID, trial Num, category, age                            
                session_id.append(imrec['sessionId'])        
                trial_num.append(imrec['trialNum']) 
                category.append(imrec['category'])
                age.append(imrec['age'])
                filename.append(os.path.join('sketches_full_dataset','{}_sketch_{}_{}.png'.format(imrec['category'], imrec['age'],imrec['sessionId'])))
                

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
                    if strec['svg']!='': # sometimes svg is empty, so don't save if so
                        _svg_per_image.append(strec['svg'])
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

                # FYI using "draw_duration_old" in analayses for consistency across runs -- this doesn't work well for 1 stroke drawings
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

                for strec in stroke_recs:
                    _svg_per_image.append(strec['svg'])

                svgs.append(_svg_per_image)
                ims.append(imrec['imgData'])
	    
	   
    ## and at the very end, do this as well
    X_out = pd.DataFrame([session_id,trial_num,category,age,submit_time,submit_date,num_strokes,draw_duration_old, draw_duration_new, mean_intensity, bounding_box, filename, svgs, ims])
    X_out = X_out.transpose()
    X_out.columns = ['session_id','trial_num','category','age','submit_time','submit_date','num_strokes','draw_duration_end_strokes', 'draw_duration_beg_vs_end_strokes','mean_intensity','bounding_box','filename','svgs','imageData']
    X_out.to_csv(os.path.join(output_dir,'Kiddraw_dataset_archive_{}_{}.csv'.format(which_run, c)))   
