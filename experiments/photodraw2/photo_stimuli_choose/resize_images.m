function resizeImages()

% make all images roughly the same pixel count and centered in the middle
% of a frame

% contains critical helper functions
addpath('HelperCode')

% parameters
frame   = 440;
visSize = 12;

% helpers
frameArea       = frame*frame;
visPixelCount   = frameArea * visSize/100;

% get categories by reading image files folder
topDir=pwd;
stimDir='photos'
categories = getVisibleFiles(stimDir)

% remove that directory if it's already there:
saveDir = [stimDir '_resized'];
mkdir(saveDir)

% saving dir for thresholded image figures
thresSaveDir = [stimDir '_Thresholds']
mkdir(thresSaveDir)

% categories = {'house'}
for s=1:length(categories)
    % get list
    try
        imageDir = fullfile(topDir, stimDir, categories(s).name);
        imList = getVisibleFiles(imageDir);
        thisCategory=categories(s).name
    catch % if we put in categories manually
        imageDir = fullfile(topDir, stimDir, categories{s});
        imList = getVisibleFiles(imageDir);
        thisCategory=categories{s} 
    end
        
    countCat=0;
    
    for i=1:length(imList)

        if strcmp(imList(i).name(end-3:end),'.png')
            disp('trying png')
            im = imread(fullfile(topDir, stimDir, thisCategory, imList(i).name), 'BackgroundColor',[1 1 1]);
        elseif strcmp(imList(i).name(end-3:end),'.jpg')
            disp('trying jpg')
            im = imread(fullfile(topDir, stimDir, thisCategory, imList(i).name));
        else
            disp(['error with image' imList(i).name])
            error('weird image type!')
        end
        
        % image(im) % show me the image
        % imageBW = mean(im,3)./255;
  
        saveName = [thisCategory '_' imList(i).name];
        
        if any(size(mean(im,3))<100) % don't get low-res images
            disp('image too small!')
            flag=1
        else
            
        flag=1; visSize=15;
        while flag & visSize > 0
           clear resizedIm newPxCount
           visSize = visSize - 1;
           visPixelCount = frameArea * visSize/100;
           [resizedIm flag newPxCount] = imAreaResize(im, saveName, thresSaveDir, visPixelCount, frame);
           actualSize = newPxCount / frameArea;
           % reduce vissize if there was a flag
           disp(['tried visSize  ' num2str(visSize), 'actual size ' num2str(actualSize)]);
      
        end
%         end
        if ~flag 
            disp(['saving... ' imList(i).name])
            countCat=countCat+1;
            if countCat<10
                imageStr=['0' num2str(countCat)];
            else 
                imageStr=num2str(countCat);
            end
            
            fn = fullfile(saveDir, [thisCategory '_'  num2str(countCat) '.png']);
            imwrite(resizedIm./255, fn, 'png');
            else  
            end
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




