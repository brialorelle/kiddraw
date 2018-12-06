## libraries
from __future__ import division

##
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

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

    parser.add_argument('--out_path', type=str, 
                                   help='where to save outputs from classifications?.', 
                                   default='classification-outputs')
    ##
    args = parser.parse_args()

    ## get name of model and split type to get predictions for
    layer_ind = args.layer_ind
    test_index = np.asarray([args.test_index])
    test_index_numeric = test_index[0]
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
    num_categories=np.shape(np.unique(y))[0]
 
    # higher tolerance and different solver for larger datasets; or else it takes foreverrrr.
    clf = linear_model.LogisticRegression(penalty='l2',C=1,tol=.1,solver='sag').fit(X_train, y_train)
        
    # correct or not
    correct_or_not = clf.score(X_test, y_test)

    # probabilities
    probs = clf.predict_proba(X_test)

    ## target label
    target_label = KM_downsampled['label'].iloc[test_index_numeric]

    # target probability
    target_label_ind = np.where(clf.classes_==target_label)
    prob_array = probs[0,target_label_ind]
    target_label_prob = (prob_array[0,0])

    # age/sessionid
    age = (KM_downsampled['age'].iloc[test_index_numeric])
    session_id = KM_downsampled['session'].iloc[test_index_numeric]

    # print it all out in a dataframe so we group metadata with outputs for easy reading into r 
    _data = pd.DataFrame([test_index_numeric, age, target_label, session_id, correct_or_not,target_label_prob])
    _data = _data.transpose()
    _data = _data.astype(object)
    _data.columns = ['index','age','target_label','session_id','correct_or_not','target_label_prob']
    ## append probability for allc classes to dataframe
    image_probs_2_df = pd.DataFrame(probs)
    image_probs_2_df.columns = clf.classes_ + "_prob"
    out = pd.concat([_data,image_probs_2_df], axis=1)

    ## save it out
    if not os.path.exists:
        os.makedirs(args.out_path)

    out.to_csv(os.path.join(out_path,'classification-outputs/museumstation_subset_classification_ind_{}.csv'.format(test_index_numeric)))