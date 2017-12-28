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
    return _Features, _Y

def save_features(Features, Y, layer_num, cohort):
    if not os.path.exists('./features'):
        os.makedirs('./features')
    layers = ['P1','P2','P3','P4','P5','FC6','FC7']
    np.save('./features/FEATURES_{}_{}.npy'.format(layers[layer_num], cohort), Features)
    Y.to_csv('./features/METADATA_{}.csv'.format(cohort))
    return layers[layer_num]

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

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, help='full path to sketches', default='../sketches')
    parser.add_argument('--layer_ind', help='fc6 = 5, fc7 = 6', default=6)
    parser.add_argument('--cohort', help='"kid" or "adult"', default='kid')    
    args = parser.parse_args()
    
    ## get list of all sketch paths
    sketch_paths = sorted(list_files(args.data))
    
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
    layer = save_features(_Features, _Y, args.layer_ind, args.cohort)
       