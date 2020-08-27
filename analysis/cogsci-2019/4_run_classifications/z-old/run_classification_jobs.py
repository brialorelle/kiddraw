# libraries
from __future__ import division

import pandas as pd
import numpy as np
import os
import thread
import subprocess
import urllib, cStringIO
import scipy.stats as stats
import multiprocessing
import subprocess




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
This script run_classification_jobs.py is a wrapper around get_classifications_parallel.py
to generate csv files that summarize key statistics of interest (e.g., classificaiton scores and probabilitioes)
from model predictions, for each model and data split.

It will spawn several threads to get predictions from all splits and models.
'''

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
    return(X,Y,KM_downsampled)

# def get_data_splits(KM,split_type):
# 	if split_type == "leave-one-out":
# 		num_iterations = np.size(KM,0)
# 	# if split_type == "k-fold":
# 	# 	num_iterations = np.size(KM,0)
# 	return(num_iterations)


# dataset = 'rendered_080318' ## srcd dataset with pre-rendered features/etc
dataset = 'rendered_111918' ## no features yet
layer_ind = 6
KF, KM = load_features('kid',layer_ind, dataset)
features, labels, KM_downsampled = balance_dataset(KF,KM)
# num_iterations = get_data_splits(KM_downsampled,"leave-one-out")
out_path = 'classification-outputs'
# start_iter = 11
# end_iter = 101
start_iter = 1
end_iter = 3
regularize_param = .01

if __name__ == "__main__":
	print 'Now running ...'
	for i in range(start_iter,end_iter):
    	
        # Make CPU jobs
		cmd_string = 'python get_classifications_parallel.py --test_index={} --layer_ind={} --dataset={} --out_path={} --regularize_param={}'.format(i,layer_ind,dataset,out_path,regularize_param)
		print cmd_string
                thread.start_new_thread(os.system,(cmd_string,))
    	
