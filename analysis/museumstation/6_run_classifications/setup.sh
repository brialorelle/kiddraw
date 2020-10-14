echo "Initializing conda for bash shell..."
conda init


echo "Creating conda env..."1
conda env create -f kiddraw.yml
conda activate kiddraw_class

echo "Installing ipython kernel..."
python -m ipykernel install --user --name kiddraw_class --display-name "Python (kiddraw_class)"



