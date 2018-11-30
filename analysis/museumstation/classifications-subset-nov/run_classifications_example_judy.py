import pandas as pd
import numpy as np
import os
import analysis_helpers as h

'''
See the script get_all_model_predictions.py, which is a wrapper around 
this script, generate_model_predictions.py to generate csv files that 
summarize key statistics of interest (e.g., target rank, cost)
from model predictions, for each model and data split.
'''

#split_types = ['balancedavg1','balancedavg2','balancedavg3','balancedavg4','balancedavg5']
split_types = ['balancedavg4','balancedavg5']

model_space = ['human_combined_cost',\
               'multimodal_fc6_combined_cost',
               'multimodal_fc6_S0_cost',
               'multimodal_fc6_combined_nocost',
               'multimodal_conv42_combined_cost']

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()

    parser.add_argument('--model', type=str, 
                                   help='which model? human_combined_cost | \
                                                      multimodal_fc6_combined_cost | \
                                                      multimodal_conv42_combined_cost |\
                                                      multimodal_fc6_S0_cost | \
                                                      multimodal_fc6_combined_nocost | ', \
                                   default='human_combined_cost')
    parser.add_argument('--split_type', type=str, 
                                        help='which split? balancedavg1 | \
                                                           balancedavg2 | \
                                                           balancedavg3 | \
                                                           balancedavg4 | \
                                                           balancedavg5 |', 
                                        default='balancedavg1')
    parser.add_argument('--predpath', type=str,
                                      help='full path to evaluate output',
                                      default='/data5/jefan/sketchpad_basic_model_output/evaluateOutput')
    parser.add_argument('--costpath', type=str,
                                      help='base path to cost dictionary for this split',
                                      default='../models/refModule/json')
    parser.add_argument('--parampath', type=str,
                                       help='base path to param posterior for for this split and model',
                                       default='../models/bdaOutput')

    args = parser.parse_args()

    ## get name of model and split type to get predictions for
    model = args.model
    split_type = args.split_type

    ## get list of prediction files
    path_to_evaluate = os.path.join(args.predpath,'{}_{}'.format(model,split_type))
    pred_files = [os.path.join(path_to_evaluate,i) for i in os.listdir(path_to_evaluate)]
    
    ## load cost dictionary for this split
    path_to_costs = os.path.join(args.costpath,'{}/costs-fixedPose96-cost_duration-average.json'.format(split_type))
    J = h.load_json(path_to_costs)         

    ## get file with params from this model
    if model.split('_')[0]=='human':
        bdaOutDir = '_'.join(model.split('_')[:1]) + '_{}'.format(split_type)
    else:
        bdaOutDir = '_'.join(model.split('_')[:2]) + '_{}'.format(split_type)
    params_fname = model + '_' + split_type + 'ParamsFlattened.csv'
    params_path = os.path.join(args.parampath,bdaOutDir,'flattened',params_fname)
    params = pd.read_csv(params_path)
    assert np.round(np.sum(np.exp(params.posteriorProb.values)),12)==1

    ## get list of all predictives (accepted MCMC samples) and
    h.sort_filelist(pred_files) ## sort pred_files into human ordering

    Obj = []
    Cond = []
    TargetRank = []
    FoilRank = []
    Logprob = []
    SampleID = []
    Trial = []
    Adaptor = []
    Cost = []

    ## loop through MCMC samples
    for i,this_sample in enumerate(pred_files):
        print 'Currently evaluating {} {} {} | sample ID: {}'.format(model, split_type, i, int(this_sample.split('/')[-1].split('Predictives.csv')[0]))

        ## read in predictions from this sample        
        sample_preds = pd.read_csv(this_sample)
        sample_ind = int(this_sample.split('/')[-1].split('Predictives.csv')[0]) ## index of MCMC sample

        ## get params that generated these predictions
    #     simScaling = params.iloc[sample_ind]['simScaling']
    #     pragWeight = params.ilo gc[sample_ind]['pragWeight']
    #     costWeight = params.iloc[sample_ind]['costWeight']
    #     infWeight = params.iloc[sample_ind]['infWeight']    
    #     posteriorProb = params.iloc[sample_ind]['posteriorProb']
    #     logLikelihood = params.iloc[sample_ind]['logLikelihood']        

        ## get congruent/incongruent context log odds for each sketch
        trials = np.unique(sample_preds['game'].values)

        ## convert modelProb to numeric type (map float first, to avoid tripping up on -Infinity)
        modelProb= map(float,sample_preds['modelProb'].values)
        sample_preds = sample_preds.assign(modelProb=pd.Series(modelProb).values)    
                
        for this_trial in trials:
            ## subset the rows that correspond to this particular trial
            trial_inds = sample_preds['game']==this_trial
            these_rows = sample_preds[trial_inds]

            assert np.round(sum(np.exp(these_rows['modelProb'].values)),6)==1

            ## sort the 64 sketch categories by model probability 
            sorted_rows = these_rows.sort_values(by=['modelProb'],ascending=False).reset_index()

            ## get target rank, logprob, prob
            target = np.unique(sorted_rows['TrueSketch'].values)[0]
            if target.split('_')[0]=='closer':
                foil = 'further_{}'.format(target.split('_')[1])
            elif target.split('_')[0]=='further':
                foil = 'closer_{}'.format(target.split('_')[1])
            target_rank = sorted_rows.index[sorted_rows['PossibleSketch']==target].tolist()[0]+1
            foil_rank = sorted_rows.index[sorted_rows['PossibleSketch']==foil].tolist()[0]+1
            tri = target_rank-1
            target_logprob = sorted_rows.iloc[tri]['modelProb']
            target_prob = np.exp(target_logprob)
            obj = sorted_rows.iloc[tri]['Target']
            condition = sorted_rows.iloc[tri]['condition']
            
            ## now get average cost of sketch produced for this trial, weighted by probability
            ## of each sketch category                
            sorted_rows['cost'] = sorted_rows['PossibleSketch'].map(J)   ## add cost column to sorted_rows                  
            _cost = sorted_rows.apply(h.weight_cost_by_modelProb,axis=1).sum() ## sum           
            
            Obj.append(obj)
            Cond.append(condition)
            TargetRank.append(target_rank)
            FoilRank.append(foil_rank)
            Logprob.append(target_logprob)
            SampleID.append(sample_ind)
            Trial.append(this_trial)
            Adaptor.append(model)
            Cost.append(_cost)


    ## make dataframe
    print 'Now making dataframe'
    X = pd.DataFrame([Obj,Cond,TargetRank,FoilRank,Logprob,SampleID,Trial,Adaptor,Cost])
    X = X.transpose()
    X.columns = ['object','condition','target_rank','foil_rank','logprob','sample_ind','trial','adaptor','cost']
    if not os.path.exists('./csv'):
        os.makedirs('./csv')
    X.to_csv('./csv/{}_{}_predictions.csv'.format(model,split_type))     
    print 'Dataframe successfully saved out.'