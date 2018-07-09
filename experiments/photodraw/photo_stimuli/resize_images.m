function resizeImages()
% make all images same pixel count
addpath('HelperCode')

% parameters
frame       = 440;

% percent of frame area
visSize      = 15; 

% helpers
frameArea       = frame*frame;
visPixelCount   = frameArea * visSize/100;

% get categories by reading image files folder
topDir=pwd;
stimDir='1_chosen_categories'
categories = getVisibleFiles(stimDir)

% remove that directory if it's already there:
saveDir = [stimDir '_resized'];
% if exist(saveDir, 'dir')
%     rmdir(saveDir, 's')
% end
mkdir(saveDir)

%% saving dir for thresholded figures
thresSaveDir = [stimDir '_Thresholds']
% if exist(thresSaveDir,'dir')
%     rmdir(thresSaveDir,'s')
% end
mkdir(thresSaveDir)

% loop through all images:
categories = {'final_set'}

for s=1:length(categories)
    % get list
    try
        imageDir = fullfile(topDir, stimDir, categories(s).name);
        imList = getVisibleFiles(imageDir);
        
        stimSaveDir=[saveDir filesep categories(s).name]
        thisCategory=categories(s).name
    catch % if we put in categories manually
        imageDir = fullfile(topDir, stimDir, categories{s});
        imList = getVisibleFiles(imageDir);
        
        stimSaveDir=[saveDir filesep categories{s}]
        thisCategory=categories{s} 
    end
        
    if exist(stimSaveDir)
        rmdir(stimSaveDir,'s')
    end
    mkdir(stimSaveDir)
    countCat=0;
    
    for i=1:length(imList)
%         try
        % read in image
        im = imread(fullfile(topDir, stimDir, thisCategory, imList(i).name));
        
        % image(im) % show me the image
        % imageBW = mean(im,3)./255;
        
        saveName = [thisCategory '_' imList(i).name];
        
        if any(size(mean(im,3))<200) % don't get low-res images
            disp('image too small!')
            flag=1
        else
          [resizedIm flag newPxCount] = imAreaResize(im, saveName, thresSaveDir,  visPixelCount, frame);
        end
        
        if ~flag 
            disp(['saving... ' imList(i).name])
            countCat=countCat+1;
            if countCat<10
                imageStr=['0' num2str(countCat)];
            else 
                imageStr=num2str(countCat);
            end
            
            fn = fullfile(saveDir, [thisCategory], [imageStr '_' thisCategory '_'  imList(i).name]);
            imwrite(resizedIm./255, fn, 'png');
        end
        
    end
    
end



end

function files = getVisibleFiles(stimDir)
% don't get invisible files
files=dir(stimDir);
dropThese=[];
for i=1:length(files)
    if strfind(files(i).name(1),'.')
        dropThese(end+1)=i;
    end
end
files(dropThese)=[];

end




