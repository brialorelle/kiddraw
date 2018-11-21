## libraries
from __future__ import division

##
import os
import urllib, cStringIO
import pymongo as pm
import numpy as np
import scipy.stats as stats
from scipy.spatial import distance
import pandas as pd

## scikit learn
import sklearn
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn import svm
from sklearn import linear_model, datasets, neighbors
from sklearn.cluster import AffinityPropagation
from sklearn import metrics
from sklearn.model_selection import LeaveOneOut

## for rebalancing datasetes
from imblearn.over_sampling import RandomOverSampler
from imblearn.under_sampling import RandomUnderSampler


###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### 
# modify paths here
def load_features(cohort, layer_num):
    layers = ['P1','P2','P3','P4','P5','FC6','FC7']    
    F = np.load('srcd-features/museumstation_features/FEATURES_{}_{}_Spatial_True.npy'.format(layers[layer_num],cohort))
    M = pd.read_csv('srcd-features/museumstation_features/METADATA_{}.csv'.format(cohort)) 
    M = M[['label','age','session']]
    return F, M

## which layer?
layer_ind = 6

###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ######


## load in features
KF, KM = load_features('kid',layer_ind)

## Randomly downsample the full dataset so that we have an even number of classes (not necessarily by age)
rus = RandomUnderSampler(random_state=0)
KF_downsampled, class_labels_downsampled = rus.fit_resample(KF, KM['label'].values)
new_samples_ind = rus.sample_indices_
KM_downsampled = KM.loc[new_samples_ind]
KM_downsampled.to_csv('classification-outputs/Resampled-metadata.csv') # save out metadata as backup

# parameters for 
loo = LeaveOneOut()
X = KF_downsampled
y = class_labels_downsampled

# make empty arrays for scores and probabilities
image_scores = np.empty(np.shape(y)[0])
image_scores[:]= np.nan

num_categories=np.shape(np.unique(class_labels_downsampled))[0]
image_probs = np.empty([np.shape(y)[0], num_categories])
image_probs[:]= np.nan

indexes = []
ages = []
target_classes = []
session_ids = []
image_probs_2=[]
image_scores_2 =[]
target_label_prob=[]

# go through all images, retrain model, and get prediction
for train_index, test_index in loo.split(X):
    X_train, X_test = X[train_index], X[test_index]
    y_train, y_test = y[train_index], y[test_index]
    
    # higher tolerance and different solver for larger datasets; or else it takes foreverrrr.
    clf = linear_model.LogisticRegression(penalty='l2',C=1,tol=.1,solver='sag').fit(X_train, y_train)
    
    # scores
    this_image_score = clf.score(X_test, y_test)
    image_scores[test_index] = this_image_score
    image_scores_2.append(this_image_score)

    # probabilities
    probs = clf.predict_proba(X_test)
    image_probs[test_index,:] = probs

    image_probs_2.append(probs)

    ## get metadata - index
    test_index_numeric = new_samples_ind[test_index[0]]
    indexes.append(test_index_numeric)
    
    ## target label
    target_label = KM_downsampled['label'][test_index_numeric]
    target_classes.append(target_label)
    
    # target probability
    target_label_ind = np.where(clf.classes_==target_label)
    prob_array = probs[0,target_label_ind]
    target_label_prob.append(prob_array[0,0])

    # age/sessionid
    ages.append(KM_downsampled['age'][test_index_numeric])
    session_ids.append(KM_downsampled['session'][test_index_numeric])

    # print output just so we know what's happening.
    print('loop index = {}, image score = {}'.format(test_index_numeric,this_image_score))

    # print it all out in a dataframe so we group metadata with outputs for easy reading into r
    if test_index>0:
        _data = pd.DataFrame([indexes, ages, target_classes, session_ids, image_scores_2,target_label_prob])
        _data = _data.transpose()
        _data = _data.astype(object)
        _data.columns = ['indexes','ages','target_classes','session_ids','image_scores','target_label_prob']
        image_probs_2_df = pd.DataFrame(image_probs)
        image_probs_2_df.columns = clf.classes_ + " prob"
        out = pd.concat([_data,image_probs_2_df], axis=1)
        out.to_csv('classification-outputs/museumstation_subset_classification.csv')