from __future__ import division
from __future__ import print_function
from __future__ import absolute_import

import copy
import numpy as np

import torch
import torchvision.models as models
import torch.nn as nn
import torchvision.transforms as transforms
import torch.nn.functional as F
from torch.autograd import Variable

from PIL import Image


use_cuda = torch.cuda.is_available()
        
class FeatureExtractor():
    
    def __init__(self,paths, use_cuda=True, imsize=224, batch_size=64, cuda_device=0, cohort='kid',spatial_avg=True, dataset='rendered_111918'):
        self.paths = paths
        self.num_sketches = len(self.paths)
        self.use_cuda = use_cuda
        self.imsize = imsize
        self.padding = 10
        self.batch_size = batch_size
        self.cuda_device = cuda_device
        self.cohort = cohort ## 'kid' if analyzing kids' drawings; 'adult' if analyzing adults' drawings
        self.spatial_avg = spatial_avg ## if true, collapse across spatial dimensions to just preserve channel activation
        self.dataset = dataset ## if true, collapse across spatial dimensions to just preserve channel activation
        
    def extract_feature_matrix(self):
        
        def RGBA2RGB(image, color=(255, 255, 255)):
            """Alpha composite an RGBA Image with a specified color.

            Simpler, faster version than the solutions above.

            Source: http://stackoverflow.com/a/9459208/284318

            Keyword Arguments:
            image -- PIL RGBA Image object
            color -- Tuple r, g, b (default 255, 255, 255)

            """
            image.load()  # needed for split()
            background = Image.new('RGB', image.size, color)
            background.paste(image, mask=image.split()[3])  # 3 is the alpha channel
            return background

        def load_image(path, imsize=224, padding=self.padding, volatile=True, use_cuda=False):
            im = Image.open(path)
            
            if self.cohort!='images':
                im = RGBA2RGB(im)
                
                # crop to sketch only (reduce white space)
                arr = np.asarray(im)
                w,h,d = np.where(arr<255) # where the image is not white
                if len(h)==0:
                    print(path)  
                try:
                    xlb = min(h)
                    xub = max(h)
                    ylb = min(w)
                    yub = max(w)
                    lb = min([xlb,ylb])
                    ub = max([xub,yub])            
                    im = im.crop((lb, lb, ub, ub))
                except ValueError:
                    print('Blank image {}'.format(path))
                    pass

            loader = transforms.Compose([
                transforms.Pad(padding),                
                transforms.Scale(imsize),
                transforms.ToTensor()])

            im = Variable(loader(im), volatile=volatile)
            # im = im.unsqueeze(0)
            if use_cuda:
                im = im.cuda(self.cuda_device)
            return im        
        
        def load_clip(model, image_input, categories, use_cuda=True,cuda_device=self.cuda_device):
            print('CUDA DEVICE NUM: {}'.format(self.cuda_device))
            text = clip.tokenize(categories).to(self.cuda_device)
            with torch.no_grad():
                image_features = model.encode_image(image_input)
                text_features = model.encode_text(text)
                
                logits_per_image, logits_per_text = model(image_input, text)
                probs = logits_per_image.softmax(dim=-1).cpu().numpy()
            return probs

  
        def get_metadata_from_path(path,dataset):

            if self.dataset=='museumstation':
                label = path.split('/')[-1].split('_')[0]
            else:
                label = path.split('/')[-2]   

            if self.cohort == 'kid':
                age = path.split('/')[-1].split('_')[2]
                session = path.split('/')[-1].split('.')[0].split('_')[-2] + '_' + path.split('/')[-1].split('.')[0].split('_')[-1]
            elif self.cohort == 'adult':
                age = 'adult'
                session = 'unknown'
            elif self.cohort == 'images':
                age = 'images'
                session = 'unknown'
                print('Setting age/session dummy variables for images...')
            else:
                print('Need to specify a cohort: "kid" or "adult"!')
                age = 'unknown'
                session = 'unknown'
            return label, age, session        

        def generator(paths, imsize=self.imsize, use_cuda=use_cuda, dataset=self.dataset):
            for path in paths:
                image = load_image(path)
                label, age, session = get_metadata_from_path(path,dataset)
                yield (image, label, age, session)        
                                                
        # define generator
        generator = generator(self.paths,imsize=self.imsize,use_cuda=self.use_cuda, dataset=self.dataset)
        
        # initialize sketch and label matrices
        Features = []
        Labels = []
        Ages = []
        Sessions = []
        
        n = 0
        quit = False 
        
        # load appropriate extractor
        import clip
        model, preprocess = clip.load("ViT-B/32", device=self.cuda_device)  
            
        
        # generate batches of sketches and labels    
        if generator:
            while True:    
                batch_size = self.batch_size
                sketch_batch = Variable(torch.zeros(batch_size, 3, self.imsize, self.imsize))                
                if use_cuda:
                    sketch_batch = sketch_batch.cuda(self.cuda_device)             
                label_batch = [] 
                age_batch = []
                session_batch = []
                if (n+1)%1==0:
                    print('Batch {}'.format(n + 1))            
                for b in range(batch_size):
                    try:
                        sketch, label, age, session = next(generator)
                        sketch_batch[b] = sketch 
                        label_batch.append(label)
                        age_batch.append(age)
                        session_batch.append(session)
                    except StopIteration:
                        quit = True
                        print('stopped!')
                        break                
                
                n = n + 1       
                if n == self.num_sketches//self.batch_size:
                    sketch_batch = sketch_batch.narrow(0,0,b)
                    label_batch = label_batch[:b + 1] 
                    age_batch = age_batch[:b + 1]   
                    session_batch = session_batch[:b + 1]
                
                # extract features from batch
                # categories = ["a rabbit", "a dog", "a bird","a fish"]
                categories = ["a bear", "a bed",  "a bee", "a bike", "a bird" , "a boat", "a book", "a bottle","a bowl","a cactus","a camel", "a car", "a cat","a chair", "a clock", "a couch", "a cow",  "a cup",   "a dog",   "a face",  "a fish",  "a frog",  "a hand",  "a hat", "a horse", "a house", "a key",   "a lamp",  "a mushroom",   "a person","a phone", "a piano", "a rabbit","a scissors","a sheep", "a snail", "a spider","a tiger", "a train", "a tree", "a TV",  "a watch", "a whale", "an airplane","an apple","an elephant" ,"an ice cream","an octopus"]
                # categories = ["a drawing of a bear", "a drawing of a bed",  "a drawing of a bee", "a drawing of a bike", "a drawing of a bird" , "a drawing of a boat", "a drawing of a book", "a drawing of a bottle","a drawing of a bowl","a drawing of a cactus","a drawing of a camel", "a drawing of a car", "a drawing of a cat","a drawing of a chair", "a drawing of a clock", "a drawing of a couch", "a drawing of a cow",  "a drawing of a cup",   "a drawing of a dog",   "a drawing of a face",  "a drawing of a fish",  "a drawing of a frog",  "a drawing of a hand",  "a drawing of a hat", "a drawing of a horse", "a drawing of a house", "a drawing of a key",   "a drawing of a lamp",  "a drawing of a mushroom",   "a drawing of a person","a drawing of a phone", "a drawing of a piano", "a drawing of a rabbit","a drawing of a pair of scissors","a drawing of a sheep", "a drawing of a snail", "a drawing of a spider","a drawing of a tiger", "a drawing of a train", "a drawing of a tree", "a drawing of a TV",  "a drawing of a watch", "a drawing of a whale", "a drawing of an airplane","a drawing of an apple","a drawing of an elephant" ,"a drawing of an ice cream cone","a drawing of an octopus"]  
                # categories = ["a cat", "a bird","a rabbit", "a house", "a chair","a bike","an airplane","a hat","a car","a watch","a cup"," a tree"]

                sketch_batch = load_clip(model, sketch_batch, categories)  
                # sketch_batch = extractor(sketch_batch)
                # sketch_batch = sketch_batch[0].cpu().data.numpy()

                if len(Features)==0:
                    Features = sketch_batch
                else:
                    Features = np.vstack((Features,sketch_batch))

                Labels.append(label_batch)
                Ages.append(age_batch)
                Sessions.append(session_batch)

                if n == self.num_sketches//batch_size + 1:
                    break
        Labels = np.array([item for sublist in Labels for item in sublist])
        Ages = np.array([item for sublist in Ages for item in sublist])
        Sessions = np.array([item for sublist in Sessions for item in sublist])
        return Features, Labels, Ages, Sessions
    