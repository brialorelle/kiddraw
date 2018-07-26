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
    fig = plt.figure(figsize=(10,10))
    ax = fig.add_subplot(111)
    if len(verts)>0:
        path = Path(verts, codes)
        patch = patches.PathPatch(path, facecolor='none', lw=2)
        ax.add_patch(patch)
        ax.set_xlim(0,1000)
        ax.set_ylim(0,1000) 
        ax.axis('off')
        plt.gca().invert_yaxis() # y values increase as you go down in image
        plt.show()
    else:
        ax.set_xlim(0,1000)
        ax.set_ylim(0,1000)        
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
    ax.set_xlim(0,900)
    ax.set_ylim(0,900)
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

def get_ref_circle(_Verts, _Codes):
    ## draw the reference star
    y_dist = np.max(_Verts[:,1]) - np.min(_Verts[:,1])
    x_dist = np.max(_Verts[:,0]) - np.min(_Verts[:,0])
    r = np.max([x_dist, y_dist])/2
    c = (400, 400)
#     circle = plt.Circle(c, r)
    
    circle_perimeter = 2 * np.pi * r
    n = len(_Verts)-1
    Verts = [(c[0]+r, c[1])]
    for x in range(1, n):
        delta_x = math.cos( 2*np.pi/n *x )*r
        delta_y = math.sin( 2*np.pi/n *x )*r
        print "delta", (delta_x, delta_y)
        
        vert_x = int(c[0] + delta_x)
        vert_y = int(c[1] + delta_y)
        print "new point", (vert_x, vert_y)
        
        Verts.append( (vert_x, vert_y) ) 
    Verts.append((c[0]+r, c[1]))  # go back to the start point
    
    Codes = np.repeat(2, len(_Codes))
    Codes[0] = 1
    print Verts
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
    if verbose==True:
        print 't is {}'.format(t)
    if (t>=0) & (t<=1):
        if verbose==True:
            print 'point lies between A and B'
        vec = point_btw_A_B(A,B,P,t) # get vector from P to the closest point on line segment AB
        C = get_point_on_AB_segment(P,vec)
    else: 
        if verbose==True:
            print 'point lies outside A and B'        
        PA = get_distance_two_points(P,A)
        PB = get_distance_two_points(P,B)
        if PA<PB:
            C = A
        elif PA>PB:
            C = B
    dist = get_distance_two_points(P,C)        
    return C, dist

def pairs(seq):
    '''
    builds a generator that iterates through a sequence, yielding subsequent pairs
    '''
    i = iter(seq)
    prev = next(i)
    for item in i:
        yield prev, item
        prev = item
        
## get centroid of the polygon defined by n vertices
## https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
## https://www.mathopenref.com/coordpolygonarea.html

def get_area_polygon(verts): 
    '''
    see: https://www.mathopenref.com/coordpolygonarea.html
    '''
    gen = pairs(verts)
    _area = 0
    for i,t in enumerate(gen):
        xi = t[0][0] ## xi
        yi = t[0][1] ## yi
        xii = t[1][0] ## xi+1
        yii = t[1][1] ## yi+1
        _area += (xi*yii - xii*yi)
    area = _area * 0.5
    return area

def get_centroid_polygon(verts):
    '''
    see: https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
    '''
    Area = get_area_polygon(verts)
    gen = pairs(verts)
    _Cx = 0
    _Cy = 0
    for i,t in enumerate(gen):        
        xi = t[0][0] ## xi
        yi = t[0][1] ## yi
        xii = t[1][0] ## xi+1
        yii = t[1][1] ## yi+1 
        _Cx += (xi + xii) * (xi*yii - xii * yi)
        _Cy += (yi + yii) * (xi*yii - xii * yi)
    Cx = _Cx * (1/(6*Area))
    Cy = _Cy * (1/(6*Area))    
    return Cx,Cy
        
def plot_coregistered_shapes(ref_verts,ref_codes,tra_verts,tra_codes):
    fig = plt.figure(figsize=(8,8))    
    ax = plt.subplot(111)
    ax.axis('off')
    ax.set_xlim(-400,400)
    ax.set_ylim(-400,400)
    path = Path(tra_verts, tra_codes)
    patch = patches.PathPatch(path, edgecolor='blue', facecolor='none', lw=3)
    ax.add_patch(patch)
    path = Path(ref_verts, ref_codes)
    patch = patches.PathPatch(path, edgecolor='red',facecolor='none', lw=3)
    ax.add_patch(patch)
    plt.gca().invert_yaxis() # y values increase as you go down in image
    plt.show()     
    
def plot_corresponding_points_on_reference(tra_verts,tra_codes,ref_verts,ref_codes,cor_verts):
    fig = plt.figure(figsize=(8,8))    
    ax = plt.subplot(111)
    ax.axis('off')
    ax.set_xlim(-400,400)
    ax.set_ylim(-400,400)
    path = Path(tra_verts, tra_codes)
    patch = patches.PathPatch(path, edgecolor='blue', facecolor='none', lw=3)
    ax.add_patch(patch)
    path = Path(ref_verts, ref_codes)
    patch = patches.PathPatch(path, edgecolor='red',facecolor='none', lw=3)
    ax.add_patch(patch)
    path = Path(cor_verts, tra_codes)
    patch = patches.PathPatch(path, edgecolor='black',facecolor='none', lw=3)
    ax.add_patch(patch)
    plt.gca().invert_yaxis() # y values increase as you go down in image
    plt.show()     
    
def near(a, b, rtol=1e-5, atol=1e-8):
    return abs(a - b) < (atol + rtol * abs(b))

def det(a, b):
    return a[0] * b[1] - a[1] * b[0]

def line_intersection(line1, line2,verbose=False):    
    '''
    see: https://stackoverflow.com/questions/15297590/improve-in-coding-saving-how-to-check-if-two-line-segments-are-crossing-in-pytho
    
    Return the coordinates of a point of intersection given two lines.
    Return None if the lines are parallel, but non-collinear.
    Return an arbitrary point of intersection if the lines are collinear.

    Parameters:
    line1 and line2: lines given by 2 points (a 2-tuple of (x,y)-coords).    
    '''
    collinear = False
    (x1,y1), (x2,y2) = line1
    (u1,v1), (u2,v2) = line2
    (a,b), (c,d) = (x2-x1, u1-u2), (y2-y1, v1-v2)
    e, f = u1-x1, v1-y1
    # Solve ((a,b), (c,d)) * (t,s) = (e,f)
    denom = float(a*d - b*c)
    if near(denom, 0):
        # parallel
        # If collinear, the equation is solvable with t = 0.
        # When t=0, s would have to equal e/b and f/d
        try:
            if (b==0): ## lines are both vertical, check if collinear
                ## https://math.stackexchange.com/questions/1102258/how-to-determine-if-some-line-segments-are-collinear 
                ## Three points are collinear if the determinant 
                ## (see below) is zero
                if near(x1*y2 + x2*v1 + u1*y1 - x1*v1 - x2*y1 - u1*y2,0):
                    if verbose==True:
                        print 'vertical, parallel and collinear'
                        collinear=True
                        return collinear
                else:
                    if verbose==True:
                        print 'vertical, parallel but not collinear'
                        return None
            elif d==0: ## lines are both horizontal, check if collinear
                if near(x1*y2 + x2*v1 + u1*y1 - x1*v1 - x2*y1 - u1*y2,0):
                    if verbose==True:                        
                        print 'horizontal, parallel and collinear' 
                        collinear=True                                                
                        return collinear
                else:
                    if verbose==True:
                        print 'horizontal, parallel but not collinear'  
                        return None
            elif near(float(e)/b, float(f)/d):
                # collinear
                px = x1
                py = y1
                collinear=True  
                print 'point of intersection returned'                
                return px, py, collinear
            else:
                if verbose==True:
                    print 'neither horizontal nor vertical, but parallel and non-collinear'
                    return None
        except:
            print 'Case unknown'
            
    else:
        t = (e*d - b*f)/denom
        # s = (a*f - e*c)/denom
        px = x1 + t*(x2-x1)
        py = y1 + t*(y2-y1)
        return px, py
    
def check_if_intersection_on_line_segments(x1,y1,x2,y2,u1,v1,u2,v2,px,py,verbose=False):    
    ## check if segments intersect at a point within the line segments
    ## if within, then go ahead and increment error by adding the triangles
    ## if outside, increment error as trapezoid
    A = np.array((x1,y1))
    B = np.array((x2,y2))
    P = np.array((px,py))
    C, dist1 = get_closest_point_from_P_to_AB(A,B,P,verbose=False)
    A = np.array((u1,v1))
    B = np.array((u2,v2))
    P = np.array((px,py))
    C, dist2 = get_closest_point_from_P_to_AB(A,B,P,verbose=False)

    if (near(dist1,0)) or (near(dist2,0)):
        if verbose==True:
            print 'point of intersection is on the line segment'
        return px,py
    else:
        return None       
    
def get_area_between_tracing_and_corresponding_verts(tra_verts,cor_verts,verbose=False):
    total_error = 0
    tra_gen = pairs(tra_verts)
    cor_gen = pairs(cor_verts)
    for i,t in enumerate(zip(tra_gen,cor_gen)):

        tra_vert_1 = tuple(t[0][0]) ## tra vert 1
        tra_vert_2 = tuple(t[0][1]) ## tra vert 2
        cor_vert_1 = tuple(t[1][0]) ## cor vert 2
        cor_vert_2 = tuple(t[1][1]) ## cor vert 2
        line1 = tuple((tra_vert_1,tra_vert_2))
        line2 = tuple((cor_vert_1,cor_vert_2))

        ## determine whether these two segments intersect
        out = line_intersection(line1,line2,verbose=verbose)

        if type(out)==bool:
            if verbose==True:
                print 'segments are collinear, do not increment error'
            this_error = 0
        elif (type(out)==tuple):
            px,py = out
            (x1,y1), (x2,y2) = line1
            (u1,v1), (u2,v2) = line2
            check = check_if_intersection_on_line_segments(x1,y1,x2,y2,u1,v1,u2,v2,px,py,verbose=verbose)        
            if check==None:
                if verbose==True:
                    print 'segments do not intersect, increment error by whole trapezoid'            
                trapezoid_verts = [(x1,y1),(x2,y2),(u1,v1),(u2,v2),(x1,v1)]
                area = get_area_polygon(trapezoid_verts)
                this_error = np.abs(area)
            elif type(check)==tuple:
                if verbose==True:                
                    print 'segments do intersect, increment error by two triangles'            
                px,py = check            
                triangle_verts_1 = [(x1,y1),(px,py),(u1,v1),(x1,y1)]
                triangle_verts_2 = [(px,py),(u2,v2),(x2,y2),(px,py)]
                area1 = get_area_polygon(triangle_verts_1)
                area2 = get_area_polygon(triangle_verts_2)    
                this_error = np.abs(area1) + np.abs(area2) 
        elif out==None:
            if verbose==True:            
                print 'segments are parallel (but not collinear), increment error'
            (x1,y1), (x2,y2) = line1
            (u1,v1), (u2,v2) = line2
            trapezoid_verts = [(x1,y1),(x2,y2),(u1,v1),(u2,v2),(x1,v1)]
            area = get_area_polygon(trapezoid_verts)
            this_error = np.abs(area)

        ## increment total_error by this_error
        total_error += this_error
    return total_error

    