from __future__ import division
import os
import urllib, cStringIO
import pymongo as pm ## first establish ssh tunnel to server where database is running
import base64
import numpy as np
from numpy import *
import PIL
from PIL import Image
import base64
import matplotlib
from matplotlib import pylab, mlab, pyplot
from IPython.core.pylabtools import figsize, getfigs
plt = pyplot
import seaborn as sns
sns.set_context('poster')
sns.set_style('white')
from matplotlib.path import Path
import matplotlib.patches as patches

import pandas as pd
from svgpathtools import parse_path

def polyline_pathmaker(lines):
    x = []
    y = []

    codes = [Path.MOVETO] # start with moveto command always
    for i,l in enumerate(lines):
        for _i,_l in enumerate(l):
            x.append(_l[0])
            y.append(_l[1])
            if _i<len(l)-1:
                codes.append(Path.LINETO) # keep pen on page
            else:
                if i != len(lines)-1: # final vertex
                    codes.append(Path.MOVETO)
    verts = zip(x,y)            
    return verts, codes

def path_renderer(verts, codes):
    fig = plt.figure(figsize=(6,6))
    ax = fig.add_subplot(111)
    if len(verts)>0:
        path = Path(verts, codes)
        patch = patches.PathPatch(path, facecolor='none', lw=2)
        ax.add_patch(patch)
        ax.set_xlim(0,500)
        ax.set_ylim(0,500) 
        ax.axis('off')
        plt.gca().invert_yaxis() # y values increase as you go down in image
        plt.show()
    else:
        ax.set_xlim(0,500)
        ax.set_ylim(0,500)        
        ax.axis('off')
        plt.show()
    plt.savefig()
    plt.close()
    
def flatten(x):
    return [val for sublist in x for val in sublist]


def get_verts_and_codes(svg_list):
    '''
    parse into x,y coordinates and output list of lists of coordinates
    
    '''    
    lines = []
    Verts = []
    Codes = []
    for stroke_ind,stroke in enumerate(svg_list):
        x = []
        y = []
        parsed = parse_path(stroke)
        for i,p in enumerate(parsed):
            if i!=len(parsed)-1: # last line segment
                x.append(p.start.real)
                y.append(p.start.imag)    
            else:
                x.append(p.start.real)
                y.append(p.start.imag)     
                x.append(p.end.real)
                y.append(p.end.imag)
        lines.append(zip(x,y))
        verts, codes = polyline_pathmaker(lines)
        Verts.append(verts)
        Codes.append(codes)                  
    return Verts, Codes
    
def make_svg_list(stroke_recs):
    '''
    grab sample drawing's strokes and make a list of svg strings from it
    '''
    svg_list = []
    for single_stroke in stroke_recs:
        svg_string = single_stroke['svg']
        svg_list.append(svg_string)  
        
    return svg_list
    
def simplify_verts_and_codes(Verts,Codes):
    X = []
    Y = []
    C = []
    for (verts,codes) in zip(Verts,Codes):
        for i,(x,y) in enumerate(verts):
            if i<len(verts)-1:
                if x==verts[i+1][0]:
                    pass
                elif y==verts[i+1][1]:
                    pass
                else:        
                    X.append(x)
                    Y.append(y)
                    C.append(codes[i])
    _Verts = np.array(zip(X,Y))
    _Codes = C
    return _Verts,_Codes    

def render_and_save(Verts,
                    Codes,
                    line_width=5,
                    imsize=8,
                    canvas_size=600,
                    session_id='SESSION_ID',
                    age='AGE',
                    trial_num='TRIAL_NUM',
                    category='CATEGORY',
                    save=False):
    
    '''
    input: 
        line_width: how wide of strokes do we want? (int)
        imsize: how big of a picture do we want? (setting the size of the figure) 
        canvas_size: original canvas size on tablet?
        out_path: where do you want to save your images? currently hardcoded below.        
    output:
        rendered sketches into nested directories
    
    '''
    ## where do you want to save your cumulative drawings?
    out_path = os.path.join('./cumulative_drawings','{}_{}'.format(session_id,age),'{}_{}'.format(trial_num,category))
    if not os.path.exists('./cumulative_drawings'):
        os.makedirs('./cumulative_drawings')
    if not os.path.exists(os.path.join('cumulative_drawings','{}_{}'.format(session_id,age))):
        os.makedirs(os.path.join('cumulative_drawings','{}_{}'.format(session_id,age)))

    verts = Verts[0]
    codes = Codes[0]
    for i,verts in enumerate(Verts):
        codes = Codes[i]
        fig = plt.figure(figsize=(imsize,imsize))    
        ax = plt.subplot(111)
        ax.axis('off')
        ax.set_xlim(0,canvas_size)
        ax.set_ylim(0,canvas_size)
        ### render sketch so far
        if len(verts)>0:
            path = Path(verts, codes)
            patch = patches.PathPatch(path, facecolor='none', lw=line_width)
            ax.add_patch(patch)
            plt.gca().invert_yaxis() # y values increase as you go down in image
            plt.show()


        ## save out as png 
        ## maybe to make it not render every single thing, use plt.ioff
        if save==True:
            if not os.path.exists(out_path):
                os.makedirs(out_path)
            fname = '{}_{}_{}_{}.png'.format(session_id,trial_num,category,i)
            filepath = os.path.join(out_path,fname)
            print filepath
            fig.savefig(filepath,bbox_inches='tight')
            plt.close(fig)   
            
def plot_shape(_Verts,_Codes):
    fig = plt.figure(figsize=(8,8))    
    ax = plt.subplot(111)
    ax.axis('off')
    ax.set_xlim(0,600)
    ax.set_ylim(0,600)
    path = Path(_Verts, _Codes)
    patch = patches.PathPatch(path, facecolor='none', lw=5)
    ax.add_patch(patch)
    plt.gca().invert_yaxis() # y values increase as you go down in image
    plt.show()    
    
def get_nearest_reference_square_to_tracing(_Verts,_Codes):
    
    ## draw reference square by hand
    TLX = np.min(_Verts[:,0]) ## top left
    TLY = np.min(_Verts[:,1])

    TRX = np.max(_Verts[:,0]) ## top right
    TRY = np.min(_Verts[:,1])

    BLX = np.min(_Verts[:,0]) ## bottom left
    BLY = np.max(_Verts[:,1])

    BRX = np.max(_Verts[:,0]) ## bottom right
    BRY = np.max(_Verts[:,1])    
    
    Verts = [(TLX,TLY),(TRX, TRY),(BRX,BRY),(BLX,BLY),(TLX,TLY)]
    Codes = [1,2,2,2,2]    
    
    return Verts, Codes    

#### helpers for getting closest point on line segment (in reference shape) to some point on the tracing

## see: https://math.stackexchange.com/questions/2193720/find-a-point-on-a-line-segment-which-is-the-closest-to-other-point-not-on-the-li

def find_t_minimizing_P_to_AB(A,B,P):
    '''
    input:  A: start of line segment AB
            B: end of line segment AB
            P: point off of line segment, you want to find the closest point on AB 
    output: t: proportion of the distance from A to B (get this by evaluating fn find_t_minimizing_P_to_AB)
    
    If 0 < t < 1, then return t
    If not, then evaluate distance from P to A, and P to B, and return minimum of those two.            
    '''
    u = A - P
    v = B - A
    t = - np.dot(v,u) / np.dot(v,v)   
    return t
    
def point_btw_A_B(A,B,P,t):
    '''
    input:  A: start of line segment AB
            B: end of line segment AB
            P: point off of line segment, you want to find the closest point on AB 
            t: proportion of the distance from A to B (get this by evaluating fn find_t_minimizing_P_to_AB)
    
    output: vector from P to the closest point on line segment AB
    
    see:     https://math.stackexchange.com/questions/2193720/find-a-point-on-a-line-segment-which-is-the-closest-to-other-point-not-on-the-li
    '''
    vec = (1-t)*A + t*B - P
    return vec

def get_point_on_AB_segment(P,vec):
    '''
    Evaluate this only when 0 < t < 1, as returned by find_t_minimizing_P_to_AB
    
    input:  P: point off the line segment
            vec: the vector returned by point_btw_A_B that goes from P to the line segment AB
    output: C: point on the AB segment that is closest to point P

    see: https://math.stackexchange.com/questions/2193720/find-a-point-on-a-line-segment-which-is-the-closest-to-other-point-not-on-the-li
    '''
    C = P + vec
    return C

def get_distance_two_points(P1,P2):
    d = np.linalg.norm(P1-P2)
    return d

def get_closest_point_from_P_to_AB(A,B,P,verbose=False):
    '''
    This is the wrapper around various other functions for finding the point on line segment AB
    that is closest to a point P that is not on the line segment AB. 
    
    Depends on: find_t_minimizing_P_to_AB
                point_btw_A_B
                get_point_on_AB_segment
                get_distance_two_points
    input:  input:  A: start of line segment AB
            B: end of line segment AB
            P: point off of line segment, you want to find the closest point on AB 
            verbose: flag to control verbosity
            
    output: C: point on the AB segment that is closest to point P. Could be either A or B if 
               projection from P to line defined by AB does not lie on the segment.    
    
    '''
    
    assert np.sum(A-B) != 0 ## A and B are not the same

    t = find_t_minimizing_P_to_AB(A,B,P) ## proportion of the distance from A to B (get this by evaluating fn find_t_minimizing_P_to_AB)
    print 't is {}'.format(t)
    if (t>=0) & (t<=1):
        print 'point lies between A and B'
        vec = point_btw_A_B(A,B,P,t) # get vector from P to the closest point on line segment AB
        C = get_point_on_AB_segment(P,vec)
    else: 
        print 'point lies outside A and B'        
        PA = get_distance_two_points(P,A)
        PB = get_distance_two_points(P,B)
        if PA<PB:
            C = A
        elif PA>PB:
            C = B
    return C