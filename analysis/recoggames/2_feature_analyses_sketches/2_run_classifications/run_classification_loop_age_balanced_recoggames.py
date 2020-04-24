# libraries
from __future__ import division

import time
import pandas as pd
import numpy as np
import os
import thread
import subprocess
import urllib, cStringIO
import scipy.stats as stats
import multiprocessing
import subprocess
from multiprocessing.dummy import Pool as ThreadPool 


## scikit learn
import sklearn
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn import svm
from sklearn import linear_model, datasets, neighbors
from sklearn import metrics
from sklearn.model_selection import LeaveOneOut

## for rebalancing datasetes
from imblearn.under_sampling import RandomUnderSampler

'''
This script run_classification_jobs.py is a wrapper around the main function get_classifications.
to generate csv files that summarize key statistics of interest (e.g., classificaiton scores and probabilitioes)
from model predictions, for each model and data split.

It will spawn several threads to get predictions from all splits and models.
'''

################################################################################################################################

def load_features(cohort, layer_num):
    layers = ['P1','P2','P3','P4','P5','FC6','FC7']    
    F = np.load('/data5/bria/kiddraw_datasets/recoggames_datasets/{}/features/FEATURES_{}_{}_Spatial_True.npy'.format(DATASET,layers[layer_num],cohort))
    M = pd.read_csv('/data5/bria/kiddraw_datasets/recoggames_datasets/{}/features/METADATA_{}.csv'.format(DATASET, cohort)) 
    # F = np.load('/Users/brialong/Documents/GitHub/kiddraw/analysis/museumstation/cogsci-2019/5_feature_space_analyses/features/{}/FEATURES_{}_{}_Spatial_True.npy'.format(DATASET,layers[layer_num],cohort))
    # M = pd.read_csv('/Users/brialong/Documents/GitHub/kiddraw/analysis/museumstation/cogsci-2019/5_feature_space_analyses/features/{}/METADATA_{}.csv'.format(DATASET, cohort)) 
    M = M[['label','age','session']]
    M['age_str'] = M.age.astype(str)
    M['label_age'] = M['label'].str.cat(M['age_str'], sep ="") 
    return F, M

def balance_dataset(KF, KM):
    rus = RandomUnderSampler(random_state=0) ## always have same random under sampling
    KF_downsampled, class_labels_downsampled = rus.fit_resample(KF, KM['label'].values)
    new_samples_ind = rus.sample_indices_
    KM_downsampled = KM.loc[new_samples_ind]
    X = KF_downsampled
    Y = class_labels_downsampled
    return(X,Y,KM_downsampled)

def balance_dataset_by_age_and_label(KF, KM):
    rus = RandomUnderSampler(random_state=0) ## always have same random under sampling
    KF_downsampled, class_by_age_labels_downsampled = rus.fit_resample(KF, KM['label_age'].values)
    new_samples_ind = rus.sample_indices_
    KM_downsampled = KM.loc[new_samples_ind]
    X = KF_downsampled
    Y = np.asarray(KM_downsampled['label'])
    return(X,Y,KM_downsampled)

def get_classifications(test_index):
    ## get name of model and split type to get predictions for
    test_index = np.asarray([test_index])
    test_index_numeric = test_index[0]
    ## append regularization parameters to saving directory
    out_path_specific = OUT_PATH + "_C_" + str(REGULARIZE_PARAM)
    ### Load features, balance dataset
    KF, KM = load_features('kid',LAYER_IND)
    X, y, KM_downsampled = balance_dataset_by_age_and_label(KF,KM)
    ## delete test index from test index array from 
    train_indexes = np.asarray(range(0,np.shape(X)[0]))
    train_indexes = np.delete(train_indexes,test_index)
    ## get train/test indexes    
    X_train, X_test = X[train_indexes], X[test_index]
    y_train, y_test = y[train_indexes], y[test_index]
    # run model
    clf = linear_model.LogisticRegression(penalty='l2',C=REGULARIZE_PARAM,tol=.1,solver='sag').fit(X_train, y_train)
    print 'running regression...'
    # get outputs and save relevant info
    correct_or_not = clf.score(X_test, y_test) # correct or not
    probs = clf.predict_proba(X_test)   # probabilities
    target_label = KM_downsampled['label'].iloc[test_index_numeric] ## target label
    age = KM_downsampled['age'].iloc[test_index_numeric]
    session_id = KM_downsampled['session'].iloc[test_index_numeric]
    # target probability
    target_label_ind = np.where(clf.classes_==target_label)
    prob_array = probs[0,target_label_ind]
    target_label_prob = (prob_array[0,0])
    # print it all out in a dataframe so we group metadata with outputs for easy reading into r 
    _data = pd.DataFrame([test_index_numeric, age, target_label, session_id, correct_or_not,target_label_prob])
    _data = _data.transpose()
    _data = _data.astype(object)
    _data.columns = ['index','age','target_label','session_id','correct_or_not','target_label_prob']
    ## append probability for all classes to dataframe
    image_probs_2_df = pd.DataFrame(probs)
    image_probs_2_df.columns = clf.classes_ + "_prob"
    out = pd.concat([_data,image_probs_2_df], axis=1)
    ## save it out
    print 'finished and saving!'
    if not os.path.exists(out_path_specific):
        os.makedirs(out_path_specific)
    out.to_csv(os.path.join(out_path_specific,'balanced_subset_classification_ind_{}.csv'.format(test_index_numeric)))

################################################################################################################################

#### SPECIFY PARAMETERS
DATASET = 'biganimalgame' 
OUT_PATH = 'classification-outputs-biganimalgame'

# DATASET = 'objectgame' 
# OUT_PATH = 'classification-outputs-objectgame'

# DATASET = 'animalgame' 
# OUT_PATH = 'classification-outputs-animalgame'

# DATASET = 'vehiclegame' 
# OUT_PATH = 'classification-outputs-vehiclegame'


LAYER_IND = 6
REGULARIZE_PARAM = .1

# start clock
start_time = time.time()

start_ind=0
end_ind=10

for this_ind in range(start_ind, end_ind):
	print 'getting classifications for index {}'.format(this_ind)
	get_classifications(this_ind)


## print output
end_time = time.time()
time_took = end_time - start_time
print '---running classifications for {} images took {} seconds'.format(np.shape(range(start_ind, end_ind))[0],time_took)
