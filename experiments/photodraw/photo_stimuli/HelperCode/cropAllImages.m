close all
clear all
clc


% ------------------------------------------------------------------------
% inputs

origStimDir = '1-SampleImages';
newStimDir = '2-CroppedImages';

imType = 'jpg';

cropToSize = [512 512]; % numRows x numCols


% ------------------------------------------------------------------------

% get list of images:
imList = dir(fullfile(origStimDir, ['*.' imType]));
imNames = {imList.name};

targetAspectRatio = cropToSize(2)/cropToSize(1);


% run it!
figure('Position', [560         454        1138         494])
for i=1:length(imNames)
    
    % load original Im
    % -----------------
    im = imread(fullfile(origStimDir, imNames{i}));
    imR = size(im,1);
    imC = size(im,2);
    imAspectRatio = imC/imR;
    
    % compute crop
    %-------------
    if imAspectRatio<= targetAspectRatio % width-limited
        newC = imC;
        newR = newC/targetAspectRatio;
    else % height-limited
        newR = imR;
        newC = targetAspectRatio*newR;
    end
    % check that height and width are equal to or smaller than original and
    % new aspect ratio matches the target aspect ratio;
    assert(newC<=imC & newR<=imR & newC/newR-targetAspectRatio<eps);

    % [XMIN YMIN WIDTH HEIGHT]
    xmin = floor((imC-newC)/2);
    ymin = floor((imR-newR)/2);
    
    imCropped = imcrop(im, [xmin ymin  newC newR]);
    
    % resize so same resolution:
    imResized = imresize(imCropped, [cropToSize]);
        
    % save it:
    % --------
    imwrite(imResized, fullfile(newStimDir, imNames{i}), imType);
    disp(['...saving ' imNames{i}]);
    
    % plot it:
    % --------
    clf
    subplot(121), imshow(im);
    subplot(122), imshow(imResized);
    drawnow
    pause
    
end;












