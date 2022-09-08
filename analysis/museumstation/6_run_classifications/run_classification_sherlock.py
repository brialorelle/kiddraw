# libraries
from __future__ import division

import time
import pandas as pd
import numpy as np
import os
import argparse


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
    F = np.load('/home/groups/mcfrank/kiddraw/cnn-features/FEATURES_{}_{}_Spatial_True.npy'.format(layers[layer_num],cohort))
    M = pd.read_csv('/home/groups/mcfrank/kiddraw/cnn-features/METADATA_{}.csv'.format(cohort)) 
    M = M[['label','age','session']]
    # M['age_str'] = M.age.astype(str)
    # M['label_age'] = M['label'].str.cat(M['age_str'], sep ="") 
    return F, M

def balance_dataset(KF, KM):
    rus = RandomUnderSampler(random_state=0) ## always have same random under sampling for reproducibility
    KF_downsampled, class_labels_downsampled = rus.fit_resample(KF, KM['label'].values)
    new_samples_ind = rus.sample_indices_
    KM_downsampled = KM.loc[new_samples_ind]
    X = KF_downsampled
    Y = class_labels_downsampled
    return(X,Y, KM_downsampled)


def get_classifications_leave_out_96(batch_index):
    ## get name of model and split type to get predictions for
    batch_index = np.asarray([batch_index])
    batch_index_numeric = batch_index[0]
    ## append regularization parameters to saving directory
    out_path_specific = OUT_PATH + "C_" + str(REGULARIZE_PARAM) + "_T_" + str(TOLERANCE)
    ### Load features, balance dataset
    KF, KM = load_features('kid',LAYER_IND)
    X, y, KM_downsampled = balance_dataset(KF,KM)
    # reset indexes
    KM_downsampled = KM_downsampled.reset_index(drop=True)
    # get indexes for each batch; deterministic so (random_state=0)
    KM_downsampled['batch']='none'
    for batch in range(0,232):
        to_sample = KM_downsampled[KM_downsampled['batch']=="none"]
        # print('size of batch = {}, batch = {}'.format(np.size(to_sample['label']),batch))
        this_batch = to_sample.groupby('label').sample(2, random_state=0)
        this_batch['batch']=batch
        KM_downsampled.loc[this_batch.index,'batch']=batch
    # for the batch we're running
    test_indexes = KM_downsampled.index[KM_downsampled['batch']==batch_index_numeric]
    ## delete test index from test index array from 
    train_indexes = np.asarray(range(0,np.shape(X)[0]))
    train_indexes = np.delete(train_indexes,test_indexes)
    ## get train/test indexes    
    X_train, X_test = X[train_indexes], X[test_indexes]
    y_train, y_test = y[train_indexes], y[test_indexes]
    # run model
    clf = linear_model.LogisticRegression(penalty='l2',C=REGULARIZE_PARAM,tol=TOLERANCE,solver='sag').fit(X_train, y_train)  
    # get outputs and save relevant info
    correct_or_not = clf.predict(X_test)==y_test # correct or not
    probs = clf.predict_proba(X_test)   # probabilities
    target_labels = KM_downsampled['label'].iloc[test_indexes] ## target label
    # assert_true(KM_downsampled['label'].iloc[test_indexes]  == y_test)
    age = KM_downsampled['age'].iloc[test_indexes]
    session_id = KM_downsampled['session'].iloc[test_indexes]
    # target probability
    # target_label_ind = np.where(clf.classes_==target_labels)
    # prob_array = probs[0,target_label_ind]
    # target_label_prob = (prob_array[0,0])
    # print it all out in a dataframe so we group metadata with outputs for easy reading into r 
    _data = pd.DataFrame([np.asarray(test_indexes), age, target_labels, session_id, correct_or_not])
    _data = _data.transpose()
    _data = _data.astype(object)
    _data.columns = ['index','age','target_label','session_id','correct_or_not']

    ## append probability for all classes to dataframe
    image_probs_2_df = pd.DataFrame(probs)
    image_probs_2_df.columns = clf.classes_ + "_prob"
    out = pd.concat([_data,image_probs_2_df], axis=1)
    ## save it out
    if not os.path.exists(out_path_specific):
        os.makedirs(out_path_specific)
    print('saving classification for batch {}'.format(batch_index_numeric))
    out.to_csv(os.path.join(out_path_specific,'museumstation_classification_batch_{}.csv'.format(batch_index_numeric)))


def get_classifications(test_index):
    ## get name of model and split type to get predictions for
    test_index = np.asarray([test_index])
    test_index_numeric = test_index[0]
    ## append regularization parameters to saving directory
    out_path_specific = OUT_PATH + "C_" + str(REGULARIZE_PARAM) + "_T_" + str(TOLERANCE)
    ### Load features, balance dataset
    KF, KM = load_features('kid',LAYER_IND)
    X, y, KM_downsampled = balance_dataset(KF,KM)
    ## delete test index from test index array from 
    train_indexes = np.asarray(range(0,np.shape(X)[0]))
    train_indexes = np.delete(train_indexes,test_index)
    ## get train/test indexes    
    X_train, X_test = X[train_indexes], X[test_index]
    y_train, y_test = y[train_indexes], y[test_index]
    # run model
    clf = linear_model.LogisticRegression(penalty='l2',C=REGULARIZE_PARAM,tol=TOLERANCE,solver='sag').fit(X_train, y_train)  
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
    if not os.path.exists(out_path_specific):
        os.makedirs(out_path_specific)
    print('saving classification')
    out.to_csv(os.path.join(out_path_specific,'museumstation_classification_ind_{}_layer_{}.csv'.format(test_index_numeric,LAYER_IND)))

################################################################################################################################

#### SPECIFY PARAMETERS
DATASET = '37K_fullset_leave96Out' ## 
LAYER_IND = 1
OUT_PATH = '/home/groups/mcfrank/kiddraw/classification-outputs/' + DATASET +'/Layer' + str(LAYER_IND)
REGULARIZE_PARAM = 1 # default = 1, had used .1 but 1 is much faster
TOLERANCE = .10

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    #  for LOO
    # parser.add_argument('--image_ind', type=int, help='Image index', default='')
    # get_classifications(image_ind)
    parser.add_argument('--batch_ind', type=int, help='Batch index', default='')
    args = parser.parse_args()      
    batch_ind = args.batch_ind
    get_classifications_leave_out_96(batch_ind)
    
    
