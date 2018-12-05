## libraries
from __future__ import division

##
import os
import urllib, cStringIO
import numpy as np
import pandas as pd

## scikit learn
import sklearn
from sklearn import linear_model, datasets, neighbors
from imblearn.under_sampling import RandomUnderSampler


def load_features(cohort, layer_num,dataset):
    layers = ['P1','P2','P3','P4','P5','FC6','FC7']    
    F = np.load('/data5/bria/kiddraw_datasets/{}/features/FEATURES_{}_{}_Spatial_True.npy'.format(dataset,layers[layer_num],cohort))
    M = pd.read_csv('/data5/bria/kiddraw_datasets/{}/features/METADATA_{}.csv'.format(dataset, cohort)) 
    M = M[['label','age','session']]
    return F, M

def balance_dataset(KF, KM):
    rus = RandomUnderSampler(random_state=0) ## always have same random under sampling
    KF_downsampled, class_labels_downsampled = rus.fit_resample(KF, KM['label'].values)
    new_samples_ind = rus.sample_indices_
    KM_downsampled = KM.loc[new_samples_ind]
    X = KF_downsampled
    Y = class_labels_downsampled
    return(X,Y, KM_downsampled)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()

    parser.add_argument('--test_index', type=int, 
                                   help='Single index for test image', 
                                   default='')

    parser.add_argument('--layer_ind', type=int, 
                                   help='', 
                                   default='')

    parser.add_argument('--dataset', type=str, 
                                   help='which render of the dataset? defaults to rendered_080318.', 
                                   default='rendered_080318')
    ##
    args = parser.parse_args()

    ## get name of model and split type to get predictions for
    layer_ind = args.layer_ind
    test_index = np.asarray([args.test_index])
    dataset = args.dataset

    ### Load features, balance dataset
    KF, KM = load_features('kid',layer_ind,dataset)
    X, y,KM_downsampled = balance_dataset(KF,KM)

    ## delete test index from test index array from 
    train_indexes = np.asarray(range(0,np.shape(X)[0]))
    train_indexes = np.delete(train_indexes,test_index)

    ## get train/test indexes    
    X_train, X_test = X[train_indexes], X[test_index]
    y_train, y_test = y[train_indexes], y[test_index]

    # make empty arrays for scores and probabilities
    image_scores = np.empty(np.shape(y)[0])
    image_scores[:]= np.nan

    class_labels_downsampled = y
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

    # higher tolerance and different solver for larger datasets; or else it takes foreverrrr.
    clf = linear_model.LogisticRegression(penalty='l2',C=1,tol=.1,solver='sag').fit(X_train, y_train)
        
    # scores
    this_image_score = clf.score(X_test, y_test)
    image_scores_2.append(this_image_score)

    # probabilities
    probs = clf.predict_proba(X_test)
    image_probs[test_index,:] = probs

    ## get metadata - index
    indexes.append(test_index)
    test_index_numeric = test_index[0]

    ## target label
    target_label = KM_downsampled['label'].iloc[test_index_numeric]
    target_classes.append(target_label)

    # target probability
    target_label_ind = np.where(clf.classes_==target_label)
    prob_array = probs[0,target_label_ind]
    target_label_prob.append(prob_array[0,0])

    # age/sessionid
    ages.append(KM_downsampled['age'].iloc[test_index_numeric])
    session_ids.append(KM_downsampled['session'].iloc[test_index_numeric])

    # print output just so we know what's happening.
    # print('loop index = {}, image score = {}'.format(test_index_numeric,this_image_score))

    # print it all out in a dataframe so we group metadata with outputs for easy reading into r 
    _data = pd.DataFrame([indexes, ages, target_classes, session_ids, image_scores_2,target_label_prob])
    _data = _data.transpose()
    _data = _data.astype(object)
    _data.columns = ['indexes','ages','target_classes','session_ids','image_scores','target_label_prob']
    ## append probability for allc classes to dataframe
    image_probs_2_df = pd.DataFrame(image_probs)
    image_probs_2_df.columns = clf.classes_ + " prob"
    out = pd.concat([_data,image_probs_2_df], axis=1)

    out.to_csv('classification-outputs/museumstation_subset_classification_ind_{}.csv'.format(test_index_numeric))