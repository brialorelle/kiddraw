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


def get_verts_and_codes(svg_list):
    '''
    parse into x,y coordinates and output list of lists of coordinates

    '''
    lines = []
    Verts = []
    Codes = []
    for stroke_ind, stroke in enumerate(svg_list):
        x = []
        y = []
        parsed = parse_path(stroke)
        for i, p in enumerate(parsed):
            if i != len(parsed) - 1:  # last line segment
                x.append(p.start.real)
                y.append(p.start.imag)
            else:
                x.append(p.start.real)
                y.append(p.start.imag)
                x.append(p.end.real)
                y.append(p.end.imag)
        lines.append(zip(x, y))
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


def render_and_save(Verts,
                    Codes,
                    line_width=5,
                    imsize=6,
                    canvas_size=809,
                    session_id='SESSION_ID',
                    age='AGE',
                    trial_num='TRIAL_NUM',
                    category='CATEGORY'):
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
    out_path = os.path.join('./cumulative_drawings', '{}_{}'.format(session_id, age),
                            '{}_{}'.format(trial_num, category))
    if not os.path.exists('./cumulative_drawings'):
        os.makedirs('./cumulative_drawings')
    if not os.path.exists(os.path.join('cumulative_drawings', '{}_{}'.format(session_id, age))):
        os.makedirs(os.path.join('cumulative_drawings', '{}_{}'.format(session_id, age)))

    verts = Verts[0]
    codes = Codes[0]
    for i, verts in enumerate(Verts):
        codes = Codes[i]
        fig = plt.figure(figsize=(imsize, imsize), frameon=False)
        ax = plt.subplot(111)
        ax.axis('off')
        ax.set_xlim(0, canvas_size)
        ax.set_ylim(0, canvas_size)

        # remove padding for xaxis and y axis
        ax.axes.get_xaxis().set_visible(False)
        ax.axes.get_yaxis().set_visible(False)
        # remove further paddings
        plt.subplots_adjust(top=1, bottom=0, right=1, left=0,
                            hspace=0, wspace=0)

        ### render sketch so far
        if len(verts) > 0:
            path = Path(verts, codes)
            patch = patches.PathPatch(path, facecolor='none', lw=line_width)
            ax.add_patch(patch)
            plt.gca().invert_yaxis()  # y values increase as you go down in image
        # plt.show()


        ## save out as png
        ## maybe to make it not render every single thing, use plt.ioff
        if not os.path.exists(out_path):
            os.makedirs(out_path)
        fname = '{}_{}_{}_{}.png'.format(session_id, trial_num, category, i)
        filepath = os.path.join(out_path, fname)
        print
        filepath

        fig.savefig(filepath, bbox_inches='tight', pad_inches=0.0)
        plt.close(fig)


def polyline_pathmaker(lines):
    x = []
    y = []

    codes = [Path.MOVETO]  # start with moveto command always
    for i, l in enumerate(lines):
        for _i, _l in enumerate(l):
            x.append(_l[0])
            y.append(_l[1])
            if _i < len(l) - 1:
                codes.append(Path.LINETO)  # keep pen on page
            else:
                if i != len(lines) - 1:  # final vertex
                    codes.append(Path.MOVETO)
    verts = zip(x, y)
    return verts, codes


def path_renderer(verts, codes):
    fig = plt.figure(figsize=(6, 6))
    ax = fig.add_subplot(111)
    if len(verts) > 0:
        path = Path(verts, codes)
        patch = patches.PathPatch(path, facecolor='none', lw=2)
        ax.add_patch(patch)
        ax.set_xlim(0, 1638)
        ax.set_ylim(0, 1638)
        ax.axis('off')
        plt.gca().invert_yaxis()  # y values increase as you go down in image
        plt.show()
    else:
        ax.set_xlim(0, 1638)
        ax.set_ylim(0, 1638)
        ax.axis('off')
        plt.show()
    plt.savefig()
    plt.close()


def flatten(x):
    return [val for sublist in x for val in sublist]