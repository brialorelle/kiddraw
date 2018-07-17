function [newIm flag newPxCount] = imAreaResize(im, saveImName, saveDir, targetPxCount, frame)


% resize image to have the proper target pixel count
% pad image to fill a frame
% error if the image doesn't fit in the frame size (by how much is it
% over?)

colorThres  = 250;
imBW        = mean(im,3);
imThresh    = imBW < colorThres;
pxCount     = sum(imThresh(:));
pxTotal     = length(imThresh(:));
pctArea     = pxCount/pxTotal * 100;

% params
saveFigFlag=1 % set to 0 if you don't want to save, 1 by default
fileName = [saveImName '_threshold.png'] % filaneme

% make and save thresholded images
subplot(1,2,1)
imshow(imBW./255);  
subplot(1,2,2)
imshow(imThresh); 
saveFigureHelper(saveFigFlag, saveDir,fileName)

%
OK = input('thres image OK?', 's')
OK = str2num(OK);

% compute the size it has to be to achieve the target Px Count
scaleFactor = sqrt(targetPxCount/pxCount);

% critical step here!
newIm = imresize(im, scaleFactor);

% recalculate new px count
imBW        = mean(newIm,3);
imThresh    = imBW<250;
newPxCount  = sum(imThresh(:));

% [targetPxCount newPxCount]
% size(newIm)

if any(size(newIm)>frame) % x or y dimension
    % if the new image doesn't fit in the frame error
    flag=1;
    disp(['Image does not fit in frame: ' num2str(size(newIm,1)) ' pixels'])
elseif OK == 0 
    flag=1;
    disp(['thresholding not ok!'])
else
    % if it fits, center it in the frame
    flag=0;
    blankIm = repmat(255, [frame frame 3]);
    
    offsetX = floor((frame-size(newIm,1))/2);
    offsetY = floor((frame-size(newIm,2))/2);
    blankIm(offsetX+1:offsetX+(size(newIm,1)), offsetY+1:offsetY+(size(newIm,2)),:) = newIm;
    
    newIm = blankIm;
end

end

