function saveFigureHelper(saveFigFlag, saveDir, figName)

if saveFigFlag
    set(gcf, 'PaperPositionMode', 'auto');
    if ~exist(saveDir, 'dir'), mkdir(saveDir), end;
    fn = fullfile(saveDir, figName);
    saveas(gcf, fn, 'png');
    disp('saving figure')
end
