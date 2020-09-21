echo "Initializing conda for bash shell..."
conda init


echo "Creating conda env..."
conda env create -f kiddraw.yml
conda activate kiddraw

echo "Installing ipython kernel..."
python -m ipykernel install --user --name kiddraw --display-name "Python (kiddraw)"



