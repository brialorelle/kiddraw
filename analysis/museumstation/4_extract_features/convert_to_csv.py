import numpy as np
import pandas as pd
# categories = ["bear", "bed",  "bee", "bike", "bird" , "boat", "book", "bottle","bowl","cactus","camel", "car", "cat","chair", "clock", "couch", "cow",  "cup",   "dog",   "face",  "fish",  "frog",  "hand",  "hat", "horse", "house", "key",   "lamp",  "mushroom",   "person","phone", "piano", "rabbit","scissors","sheep", "snail", "spider","tiger", "train", "tree", "TV",  "watch", "whale", "an airplane","an apple","an elephant" ,"an ice cream","an octopus"]
categories = ["bear", "bed",  "bee", "bike", "bird" , "boat", "book", "bottle","bowl","cactus","camel", "car", "cat","chair", "clock", "couch", "cow",  "cup",   "dog",   "face",  "fish",  "frog",  "hand",  "hat", "horse", "house", "key",   "lamp",  "mushroom",   "person","phone", "piano", "rabbit","scissors","sheep", "snail", "spider","tiger", "train", "tree", "TV",  "watch", "whale", "airplane","apple","elephant" ,"ice.cream","octopus"]

data = np.load('CLIP_FEATURES_kid_museumstation.npy')
X_out = pd.DataFrame(data)
X_out.columns = categories
X_out.to_csv('CLIP_FEATURES_museumstation.csv')

# np.savetxt('clip_features.csv', dataframe, delimiter=",")

