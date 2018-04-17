#!/usr/local/bin/python

## wrapper script to download 100 photos from all the eitz synsets to a photos folder

import imagenet_datasets as id

eitz_synsets = id.get_list_of_eitz_synsets()
id.download_images_by_synset(eitz_synsets,num_per_synset=100)