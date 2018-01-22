from __future__ import division

import torch
import torchvision.models as models
import torch.nn as nn
import torchvision.transforms as transforms
import torch.nn.functional as F
from torch.autograd import Variable

from glob import glob
import os

import numpy as np
import pandas as pd
import json
import re

from PIL import Image
import base64

from embedding import *

# retrieve sketch paths
def list_files(path, ext='png'):
    result = [y for x in os.walk(path) for y in glob(os.path.join(x[0], '*.%s' % ext))]
    return result

def check_invalid_sketch(filenames,invalids_path='drawings_to_exclude_clean.txt'):    
    if not os.path.exists(invalids_path):
        print('No file containing invalid paths at {}'.format(invalids_path))
        invalids = []        
    else:
        x = pd.read_csv(invalids_path, header=None)
        x.columns = ['filenames']
        invalids = list(x.filenames.values)
    valids = []   
    basenames = [f.split('/')[-1] for f in filenames]
    for i,f in enumerate(basenames):
        if f not in invalids:
            valids.append(filenames[i])
    return valids

def make_dataframe(Labels,Ages,Sessions):    
    Y = pd.DataFrame([Labels,Ages,Sessions])
    Y = Y.transpose()
    Y.columns = ['label','age','session']   
    return Y

def normalize(X):
    X = X - X.mean(0)
    X = X / np.maximum(X.std(0), 1e-5)
    return X

def preprocess_features(Features, Y):
    _Y = Y.sort_values(['label','age','session'])
    inds = np.array(_Y.index)
    _Features = normalize(Features[inds])
    _Y = _Y.reset_index(drop=True) # reset pandas dataframe index
    return _Features, _Y

def save_features(Features, Y, layer_num, cohort):
    if not os.path.exists('./features'):
        os.makedirs('./features')
    layers = ['P1','P2','P3','P4','P5','FC6','FC7']
    np.save('./features/FEATURES_{}_{}.npy'.format(layers[int(layer_num)], cohort), Features)
    Y.to_csv('./features/METADATA_{}.csv'.format(cohort))
    return layers[int(layer_num)]

def convert_age(Ages):
    '''
    handle trials where we didn't have age information
    '''
    ages = []
    for a in Ages:
        if len(a)>0:
            ages.append(int(a))
        else:
            ages.append(-1)
    return ages

## remove data where you dont have age information
def remove_nans(Features, Y):
    ind = Y.index[(Y['age'] > 0)]
    _Y = Y.loc[ind]
    _Features = Features[ind.tolist()]
    return _Features, _Y

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, help='full path to sketches', default='../sketches')
    parser.add_argument('--layer_ind', help='fc6 = 5, fc7 = 6', default=6)
    parser.add_argument('--cohort', help='"kid" or "adult"', default='kid')    
    args = parser.parse_args()
    
    ## get list of all sketch paths
    sketch_paths = sorted(list_files(args.data))
    print('Length of sketch_paths before filtering: {}'.format(len(sketch_paths)))
    
    ## filter out invalid sketches
    sketch_paths = check_invalid_sketch(sketch_paths)
    print('Length of sketch_paths after filtering: {}'.format(len(sketch_paths)))    
    
    ## extract features
    layers = ['P1','P2','P3','P4','P5','FC6','FC7']
    extractor = FeatureExtractor(sketch_paths,layer=args.layer_ind,cohort=args.cohort)
    Features, Labels, Ages, Sessions = extractor.extract_feature_matrix()
    
    ## handle trials where we didn't have age information
    if args.cohort=='kid':
        Ages = convert_age(Ages)       
        
    # organize metadata into dataframe
    Y = make_dataframe(Labels,Ages,Sessions)
    _Features, _Y = preprocess_features(Features, Y)
    
    # remove nans from kid dataframe (where we didn't have age information)
    if args.cohort=='kid':
        _Features, _Y = remove_nans(_Features, _Y) 

    layer = save_features(_Features, _Y, args.layer_ind, args.cohort)
       