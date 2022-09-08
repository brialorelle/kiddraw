echo "Initializing conda for bash shell..."
conda init bash

# echo "Creating conda env..."
# conda env create -f kiddraw.yml

echo "Activating conda env..."
conda activate kiddraw_class

echo "Installing ipython kernel..."
python -m ipykernel install --user --name kiddraw_class --display-name "Python (kiddraw_class)"
