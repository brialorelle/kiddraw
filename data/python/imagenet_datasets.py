import os
import tarfile
import cPickle
import itertools
from urllib2 import urlopen
from collections import defaultdict
import networkx
import numpy as np
import tabular as tb
import skdata.larray as larray
from skdata.data_home import get_data_home
from bs4 import BeautifulSoup
import random
from random import sample
# from dldata.stimulus_sets.dataset_templates import get_id
# from dldata.stimulus_sets import dataset_templates
from joblib import Parallel, delayed
import pymongo as pm
import gridfs
import boto
import requests

import object_correspondences as oc

def build_imagenet_to_labels_dict():
  # define mapping from imagenet synset to common labels
  d0 = oc.sketch_obj_correspondences
  synset = []
  labels = []
  for key in d0:
    try:
        synset.append(d0[key]['imagenet'][0])
        labels.append(key)
    except:
      pass

  imagenet_to_labels = dict(zip(synset,labels))
  return imagenet_to_labels

def get_list_of_eitz_synsets():
  d0 = oc.sketch_obj_correspondences
  synset = []
  for key in d0:
    try:
      synset.append(d0[key]['imagenet'][0])
    except:
      pass
  return synset

def deborkify_eitz_names():
  d0 = oc.sketch_obj_correspondences
  borked_keys = d0.keys()
  doctify = dict(zip(borked_keys,borked_keys))
  doctify['car (sedan)'] = 'car'
  doctify['computer monitor'] = 'monitor'
  doctify['mouse (animal)'] = 'mouse'
  doctify['santa claus'] = 'santa'
  doctify['space shuttle'] = 'space-shuttle'
  doctify['standing bird'] = 'standing-bird'
  return doctify

def download_images_by_synset(synsets, num_per_synset=100, path=None,
                              imagenet_username='jefan', accesskey='f5f789c3fb79bfc5e76237ac3feb55b4e959b0ff'):
  """
  Downloads images by synset, like it says. 
  Takes in a list of synsets, and optionally number of photos per synset, and saves images in a directory called photos 
  """
  path = os.path.join(os.getcwd(),'photos')
  if not os.path.exists(path):
      os.makedirs(path)
  imagenet_to_labels = build_imagenet_to_labels_dict()
  synsets = list(synsets)
  kept_names = []
  kept_synset_list = []
  for i, s in enumerate(synsets):
      url = 'http://www.image-net.org/api/text/imagenet.synset.geturls?' + \
            'wnid=' + str(s) + \
            '&username=' + imagenet_username + \
            '&accesskey=' + accesskey + \
            '&release=latest'
      print i
      print url
      label = imagenet_to_labels[s]
      deborked_dict = deborkify_eitz_names() # deborkify eitz names in some cases
      label = deborked_dict[label]
      url_file = urlopen(url)
      counter = 0
      for f in url_file:
        if counter<num_per_synset:
          f1 = (f)
          try:
            img_data = requests.get(f1, stream=True).content
            filename = os.path.join(path,label + '_{0:03d}.jpg'.format(counter))
            with open(filename, 'wb') as handler:
                handler.write(img_data)
                # validate image before moving on
                filesize = os.stat(filename).st_size
                #print label, counter, filesize
                if filesize<100000: # smaller than some threshold filesize
                  os.remove(filename)
                else:
                  counter += 1
          except Exception as e:
            print e
            pass


