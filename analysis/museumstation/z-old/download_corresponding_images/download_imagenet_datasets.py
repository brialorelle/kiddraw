import os
import itertools
from urllib2 import urlopen
import numpy as np
import random
from random import sample
import pymongo as pm
import requests
import object_correspondences as oc
from PIL import Image

def build_imagenet_to_labels_dict():
  # define mapping from imagenet synset to common labels
  d0 = oc.sketch_imagenet_dict
  synset = []
  labels = []
  for key in d0:
    try:
        synset.append(d0[key])
        labels.append(key)
    except:
      pass

  imagenet_to_labels = dict(zip(synset,labels))
  return imagenet_to_labels

def get_list_of_synsets():
  d0 = oc.sketch_imagenet_dict
  synset = []
  for key in d0:
    try:
      synset.append(d0[key])
    except:
      pass
  return synset

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
      label = imagenet_to_labels[s]
      print '{} | {} | {}'.format(i, label, url)
      # SIDICT = oc.sketch_imagenet_dict
      # label = SIDICT[label]
      url_file = urlopen(url)
      counter = 0
      for u,f in enumerate(url_file):
          print '{} | {}'.format(u,f)
        if counter<num_per_synset:
          f1 = (f)
          try:
            img_data = requests.get(f1, timeout=(3.05, 3.05)).content
            if not os.path.exists(os.path.join(path,label)):
                os.makedirs(os.path.join(path,label))
            filename = os.path.join(path,label, '{0:04d}.jpg'.format(counter))
            with open(filename, 'wb') as handler:
                handler.write(img_data)
                # validate image before moving on
                filesize = os.stat(filename).st_size
                #print label, counter, filesize
                try:
                    x = Image.open(filename)
                    if filesize<100000: # smaller than some threshold filesize
                        print 'File too small, going to skip this one...'
                        os.remove(filename)
                    else:
                      counter += 1
                      print '{} images so far...'.format(counter)
                except IOError:
                    print 'IO Error, going to skip this one...'
                    os.remove(filename)
                    pass
          except Exception as e:
            print e
            pass


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_per_synset', type=int, default=100)
    args = parser.parse_args()

    ## get list of synsets
    synset_list = get_list_of_synsets()
    download_images_by_synset(synset_list,num_per_synset=args.num_per_synset)
