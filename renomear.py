import os
import pyheif
from PIL import Image

# Caminho da pasta das imagens HEIC
pasta = "img"  # ajuste conforme seu projeto

# Lista apenas arquivos .heic
arquivos = [f for f in os.listdir(pasta) if f.lower().endswith(".heic")]
arquivos.sort()  # para manter sequência consistente

for i, arquivo in enumerate(arquivos, start=1):
    caminho_antigo = os.path.join(pasta, arquivo)
    
    # Lê o HEIC
    heif_file = pyheif.read(caminho_antigo)
    
    # Converte para PIL Image
    img = Image.frombytes(
        heif_file.mode,
        heif_file.size,
        heif_file.data,
        "raw",
        heif_file_
